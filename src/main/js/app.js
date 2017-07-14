"use strict";

/*
 * CONFIG
 */
// dependencies
var restify = require("restify");
var builder = require("botbuilder");
var request = require("request");
var ua = require('universal-analytics');
var raven = require('raven');
var nconf = require("nconf");
var winston = require("winston");


// application conf
var config = nconf.env().argv().file({file: "secrets.json"});
config.app = require("../../../package.json");
config.persona = config.get("PERSONA") ? config.get("PERSONA").toLowerCase() : "default";

// logging conf
winston.configure({
    transports: [
        new (winston.transports.Console)({
            level: config.get("LOG_LEVEL") || "info",
            colorize: "all",
            timestamp: false
        })
    ]
});
raven.config(`https://${config.get("SENTRY_USERNAME")}:${config.get("SENTRY_PASSWORD")}@sentry.io/${config.get("SENTRY_APP_ID")}`).install();

// services conf
var luis = require("./services/luis")(config.get("LUIS_APP_ID"), config.get("LUIS_SUBSCRIPTION_KEY"));
var datapoint = require("./services/datapoint").new(config.get("NEW_DATAPOINT_API_KEY"));
var gmaps = require("./services/gmaps")(config.get("GOOGLE_MAPS_API_KEY"));

/*
 * Application entry point
 */
function main() {
    winston.info("starting %s %s", config.app.name, config.app.version);

    // Set up the bot server..
    var server = restify.createServer({name: config.app.name});
    server.use(restify.bodyParser({mapParams: false}));
    server.listen(config.get("PORT") || 3978, () => {
        winston.info("%s listening on %s", server.name, server.url);
    });

    var appIdStr = "MICROSOFT_APP_ID";
    var appPasswordStr = "MICROSOFT_APP_PASSWORD";
    if (config.get("DEBUG")) {
        appIdStr = `DEV_${appIdStr}`;
        appPasswordStr = `DEV_${appPasswordStr}`;
    }
    var connector = new builder.ChatConnector({
        appId: config.get(appIdStr),
        appPassword: config.get(appPasswordStr)
    });
    server.post("/api/messages", connector.listen());

    var bot = new builder.UniversalBot(connector, {persistConversationData: true});

    var intents = require("./intents");
    var prompt = require("./prompt");
    var persona = require("./persona")(require(`../resources/personas/${config.persona}.json`));

    //conversation root
    bot.dialog("/", [
        (session) => {
            if (config.get("DEBUG_TOOLS") && debugTools(session)) {
                return;
            }
            if (!session.userData.uuid) {
                if (session.message.address.channelId === "facebook") {
                    session.userData["channel"] = "fb";
                    session.userData["name"] = session.message.address.user.name.split(" ")[0];
                    session.userData["fb"] = session.message.address.user;
                }
                session.userData["ga_id"] = config.get("GOOGLE_ANALYTICS_ID");
                session.userData["uuid"] = ua(session.userData.ga_id).cid;
            }
            luis.parse(session.message.text)
                .then((response) => {
                    if (response.topScoringIntent.score >= 0.1) {
                        session.beginDialog(response.topScoringIntent.intent.toLowerCase(), response);
                    } else {
                        if (!session.userData.greeted) {
                            session.beginDialog("smalltalk.greeting");
                        } else {
                            session.beginDialog("none");
                        }
                    }
                })
                .catch((err) => {
                    winston.error("%s", err);
                    session.send(persona.getResponse("error.general"));
                    session.endDialog();
                });
        }
    ]);

    // add the intents
    intents.none(bot, persona);
    intents.help(bot, persona);
    intents.repeat(bot, persona);

    intents.met_office.general_information(bot, persona);

    // weather
    intents.weather.accessory(bot, persona, datapoint, gmaps);
    intents.weather.accessories.unknown(bot, persona);
    intents.weather.accessories.coat(bot, persona);
    intents.weather.accessories.umbrella(bot, persona);
    intents.weather.accessories.jumper(bot, persona);
    intents.weather.accessories.sun_cream(bot, persona);

    intents.weather.forecast(bot, persona, datapoint, gmaps);
    intents.weather.detail(bot, persona);

    intents.weather.variable(bot, persona, datapoint, gmaps);
    intents.weather.variables.unknown(bot, persona);
    intents.weather.variables.sun(bot, persona);
    intents.weather.variables.rain(bot, persona);

    // smalltalk
    intents.smalltalk.greeting(bot, persona);
    intents.smalltalk.farewell(bot, persona);

    intents.smalltalk.bot.are_you_a_chatbot(bot, persona);
    intents.smalltalk.bot.are_you_busy(bot, persona);
    intents.smalltalk.bot.are_you_hungry(bot, persona);
    intents.smalltalk.bot.are_you_ok(bot, persona);
    intents.smalltalk.bot.are_you_real(bot, persona);
    intents.smalltalk.bot.family_status(bot, persona);
    intents.smalltalk.bot.how_old_are_you(bot, persona);
    intents.smalltalk.bot.name(bot, persona);
    intents.smalltalk.bot.relationship_status(bot, persona);
    intents.smalltalk.bot.what_is_your_salary(bot, persona);
    intents.smalltalk.bot.when_is_your_birthday(bot, persona);
    intents.smalltalk.bot.where_are_you_from(bot, persona);
    intents.smalltalk.bot.where_do_you_work(bot, persona);
    intents.smalltalk.bot.who_are_you(bot, persona);
    intents.smalltalk.bot.would_you_like_to_be_human(bot, persona);
    intents.smalltalk.bot.how_are_you(bot, persona);

    intents.smalltalk.courtesy.good(bot, persona);
    intents.smalltalk.courtesy.no(bot, persona);
    intents.smalltalk.courtesy.no_problem(bot, persona);
    intents.smalltalk.courtesy.okay(bot, persona);
    intents.smalltalk.courtesy.please(bot, persona);
    intents.smalltalk.courtesy.sorry(bot, persona);
    intents.smalltalk.courtesy.thank_you(bot, persona);
    intents.smalltalk.courtesy.well_done(bot, persona);
    intents.smalltalk.courtesy.yes(bot, persona);
    intents.smalltalk.courtesy.you_are_welcome(bot, persona);

    intents.smalltalk.user.bored(bot, persona);
    intents.smalltalk.user.happy(bot, persona);
    intents.smalltalk.user.robot(bot, persona);
    intents.smalltalk.user.sad(bot, persona);
    intents.smalltalk.user.tired(bot, persona);

    intents.smalltalk.emotions.boo(bot, persona);
    intents.smalltalk.emotions.cool(bot, persona);
    intents.smalltalk.emotions.ha_ha(bot, persona);
    intents.smalltalk.emotions.la_la(bot, persona);
    intents.smalltalk.emotions.wow(bot, persona);

    // user
    intents.user.name(bot, persona);

    // prompt
    prompt(bot, persona);

}
raven.context(function () {
    main();
});

function debugTools(session) {
    if (session.message.text === "/dAllData") {
        session.userData = {};
        session.conversationData = {};
        session.send("all data deleted");
        return true;
    }
    if (session.message.text === "/dConversationData") {
        session.conversationData = {};
        session.send("conversation data deleted");
        return true;
    }
    if (session.message.text === "/sConversationData") {
        console.log(session.conversationData);
        session.send(JSON.stringify(session.conversationData));
        return true;
    }
    if (session.message.text === "/dUserData") {
        session.userData = {};
        session.send("user data deleted");
        return true;
    }
    if (session.message.text === "/sUserData") {
        console.log(session.userData);
        session.send(JSON.stringify(session.userData));
        return true;
    }
    return false;
}
