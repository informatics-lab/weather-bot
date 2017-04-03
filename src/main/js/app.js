"use strict";

// dependencies
var nconf = require("nconf");
var restify = require("restify");
var request = require("request");
var builder = require("botbuilder");
var winston = require("winston");

// application conf
var config = nconf.env().argv().file({file: "secrets.json"});
var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({
            level: config.get("LOG_LEVEL"),
            colorize: true,
            timestamp: false
        })
    ]
});
var app = require("../../../package.json");


/*
 * application entry point
 */
function main() {
    logger.info("starting %s %s", app.name, app.version);

    // Set up the bot server..
    var server = restify.createServer({name:app.name});
    server.use(restify.bodyParser({mapParams: false}));
    server.listen(config.get("PORT") || 3978, function () {
        logger.info('%s listening on %s', server.name, server.url);
    });

    server.post('/api/messages', function() {});

};
main();