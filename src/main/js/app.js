"use strict";

/*
 * CONFIG
 */
// dependencies
var restify = require("restify");
var builder = require("botbuilder");
var request = require("request");

// application conf
var nconf = require("nconf");
var config = nconf.env().argv().file({file: "secrets.json"});
config.app = require("../../../package.json");
config.persona = config.get("PERSONA") ? config.get("PERSONA").toLowerCase() : "default";

// logging conf
var winston = require("winston");
winston.configure({
    transports: [
        new (winston.transports.Console)({
            level: config.get("LOG_LEVEL") || "info",
            colorize: "all",
            timestamp: false
        })
    ]
});
var luis = require("./services/luis")(config.get("LUIS_APP_ID"), config.get("LUIS_SUBSCRIPTION_KEY"));

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
    var connector = new builder.ChatConnector({
        appId: config.get("MICROSOFT_APP_ID"),
        appPassword: config.get("MICROSOFT_APP_PASSWORD")
    });
    server.post("/api/messages", connector.listen());

    var bot = new builder.UniversalBot(connector, {persistConversationData: true});

    var dialogs = require("./dialogs");
    var intents = require("./intents");
    var persona = require("./persona")(require(`../resources/personas/${config.persona}.json`));

    //conversation root
    bot.dialog("/", [
        (session) => {
            if(config.get("DEBUG_TOOLS") && debugTools(session)) {
                return;
            }
            luis.parse(session.message.text)
                .then((response) => {
                    session.beginDialog(response.topScoringIntent.intent.toLowerCase(), response);
                })
                .catch((err) => {
                    winston.error("%s", err);
                    session.send(persona.getResponse("error"));
                    session.endDialog();
                });
        }
    ]);

    // add the intents
    intents.none(bot, persona);
    intents.help(bot, persona);

    // weather
    intents.weather.forecast(bot, persona);

    // smalltalk
    intents.smalltalk.greeting(bot, persona);
    intents.smalltalk.bot.are_you_a_chatbot(bot, persona);
    
    intents.smalltalk.user.bored(bot, persona);

    intents.user.name(bot, persona);

    // add bot dialogs here.
    dialogs.user.name(bot, persona);
    dialogs.user.location(bot, persona);

}
main();

function debugTools(session) {
    if(session.message.text === "/dUserData"){
        session.userData = {};
        session.send("user data deleted");
        return true;
    }
    if(session.message.text === "/sUserData"){
        console.log(session.userData);
        session.send(JSON.stringify(session.userData));
        return true;
    }
    return false;
}