"use strict";

// dependencies
var nconf = require("nconf");
var restify = require("restify");
var request = require("request");
var builder = require("botbuilder");
var winston = require("winston");

// application conf
var config = nconf.env().argv().file({file: "secrets.json"});
winston.configure({
    transports: [
        new (winston.transports.Console)({
            level: config.get("LOG_LEVEL"),
            colorize: true,
            timestamp: false
        })
    ]
});
var app = require("../../../package.json");


var domains = require("./domains");


/*
 * application entry point
 */
function main() {
    winston.info("starting %s %s", app.name, app.version);

    // Set up the bot server..
    var server = restify.createServer({name:app.name});
    server.use(restify.bodyParser({mapParams: false}));
    server.listen(config.get("PORT") || 3978, function () {
        winston.info('%s listening on %s', server.name, server.url);
    });
    var connector = new builder.ChatConnector({
        appId: config.get("MICROSOFT_APP_ID"),
        appPassword: config.get("MICROSOFT_APP_PASSWORD")
    });
    server.post('/api/messages', connector.listen());
    
    var bot = new builder.UniversalBot(connector, {persistConversationData: true});

    var recognizer = new builder.LuisRecognizer(config.get("LUIS_MODEL_URL"));
    bot.recognizer(recognizer);

    domains.general.greeting(bot);

};
main();