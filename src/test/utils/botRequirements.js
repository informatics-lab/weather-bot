"use strict";

var restify = require("restify");
var builder = require("botbuilder");
var request = require("request");
var ua = require('universal-analytics');
var raven = require('raven');
var nconf = require("nconf");
var winston = require("winston");

const MAIN = '../../main/js'


function get(showBotMessages, loglevel) {

    showBotMessages = (showBotMessages === true) ? true : false;
    loglevel = loglevel || 'warn';

    // application conf
    var config = nconf.env().argv().file({ file: "secrets.json" });
    config.app = require("../../../package.json");
    config.persona = config.get("PERSONA") ? config.get("PERSONA").toLowerCase() : "default";

    // logging conf
    winston.level = loglevel;

    // services conf
    var luis = require(`${MAIN}/services/luis`)(config.get("LUIS_APP_ID"), config.get("LUIS_SUBSCRIPTION_KEY"));
    var datapoint = require(`${MAIN}/services/datapoint`).new(config.get("NEW_DATAPOINT_API_KEY"));
    var gmaps = require(`${MAIN}/services/gmaps`)(config.get("GOOGLE_MAPS_API_KEY"));
    var persona = require(`${MAIN}/persona`)(require(`${MAIN}/../resources/personas/${config.persona}.json`));


    var appIdStr = "MICROSOFT_APP_ID";
    var appPasswordStr = "MICROSOFT_APP_PASSWORD";
    if (config.get("DEBUG")) {
        appIdStr = `DEV_${appIdStr}`;
        appPasswordStr = `DEV_${appPasswordStr}`;
    }

    var connector = new builder.ConsoleConnector()
    if (!showBotMessages) {
        connector.send = () => undefined; // Stop output to console.
    }

    return {
        luis: luis,
        connector: connector,
        config: config,
        persona: persona,
        datapoint: datapoint,
        gmaps: gmaps,
        ua: ua
    }
}
module.exports = get;