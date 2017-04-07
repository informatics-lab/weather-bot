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

function askLUIS(q) {
    var uri = config.get("LUIS_MODEL_URL") + q;
    return new Promise(function (resolve, reject) {
        var options = {
            uri: uri,
            method: 'GET'
        };
        request(options, function (err, response, body) {
            if(!err) {
                resolve(JSON.parse(body));
            } else {
                winston.error(err);
                reject(err);
            }
        });
    })
}

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
    var intents = require("./intents");
    var persona = require("./persona")(require("../resources/personas/" + config.persona + ".json"));

    //conversation root
    bot.dialog("/", [ function(session) {
        askLUIS(session.message.text)
            .then(function(response) {
                session.beginDialog(response.topScoringIntent.intent, response);
            });
    }]);

    bot.on('error', function (e) {
        winston.error(e);
    });

    // add the intents
    intents.none(bot, persona);
    intents.help(bot, persona);
    intents.general.greeting(bot, persona);

    //add bot dialogs here.
    dialogs.user.name(bot, persona);

}
main();