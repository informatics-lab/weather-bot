"use strict";

/*
 * CONFIG
 */
// dependencies
var restify = require("restify");
var builder = require("botbuilder");

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


/*
 * Application entry point
 */
function main() {
    winston.info("starting %s %s", config.app.name, config.app.version);

    // Set up the bot server..
    var server = restify.createServer({name: config.app.name});
    server.use(restify.bodyParser({mapParams: false}));
    server.listen(config.get("PORT") || 3978, function () {
        winston.info("%s listening on %s", server.name, server.url);
    });
    var connector = new builder.ChatConnector({
        appId: config.get("MICROSOFT_APP_ID"),
        appPassword: config.get("MICROSOFT_APP_PASSWORD")
    });
    server.post("/api/messages", connector.listen());

    var bot = new builder.UniversalBot(connector, {persistConversationData: true});

    var dialogs = require("./dialogs");
    var domains = require("./domains");
    var persona = require("./persona")(require("../resources/personas/" + config.persona + ".json"));

    var recognizer = new builder.LuisRecognizer(config.get("LUIS_MODEL_URL"));
    bot.recognizer(recognizer);

    bot.on('error', function (e) {
        winston.error(e);
    });

    // add the none intent
    domains.none(bot, persona, recognizer);
    
    // add bot knowledge domains here.
    domains.general.greeting(bot, persona);

    //add bot dialogs here.
    dialogs.user.name(bot, persona);

}
main();