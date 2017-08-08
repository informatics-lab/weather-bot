"use strict";

var restify = require("restify");
var builder = require("botbuilder");
var request = require("request");
var ua = require('universal-analytics');
var raven = require('raven');
var nconf = require("nconf");
var winston = require("winston");

var IS_PRODUCTION = (process.env.ENVIRONMENT === "production");


// application conf
var config = nconf.env().argv().file({ file: "secrets.json" });
config.app = require("../../../package.json");
config.persona = config.get("PERSONA") ? config.get("PERSONA").toLowerCase() : "default";

// logging conf
winston.configure({
    transports: [
        new(winston.transports.Console)({
            level: config.get("LOG_LEVEL") || "info",
            colorize: (IS_PRODUCTION) ? false : "all",
            timestamp: false
        })
    ]
});
raven.config(`https://${config.get("SENTRY_USERNAME")}:${config.get("SENTRY_PASSWORD")}@sentry.io/${config.get("SENTRY_APP_ID")}`).install();

// services conf
var luis = require("./services/luis")(config.get("LUIS_APP_ID"), config.get("LUIS_SUBSCRIPTION_KEY"));
var datapoint = require("./services/datapoint").new(config.get("NEW_DATAPOINT_API_KEY"));
var gmaps = require("./services/gmaps")(config.get("GOOGLE_MAPS_API_KEY"));
var persona = require("./persona")(require(`../resources/personas/${config.persona}.json`));


function main() {
    var server = restify.createServer({ name: config.app.name });
    server.use(restify.bodyParser({ mapParams: false }));
    server.listen(config.get("PORT") || 3978, () => {
        winston.info("%s listening on %s", server.name, server.url);
    });

    var appIdStr = "MICROSOFT_APP_ID";
    var appPasswordStr = "MICROSOFT_APP_PASSWORD";
    var connector = new builder.ChatConnector({
        appId: config.get(appIdStr),
        appPassword: config.get(appPasswordStr)
    });
    server.post("/api/messages", connector.listen());
    require('./bot')(luis, connector, config, persona, datapoint, gmaps, ua);
};

if (IS_PRODUCTION) {
    raven.context(function() {
        main();
    });
} else {
    main();
}
