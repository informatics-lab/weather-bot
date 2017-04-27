"use strict";

var winston = require("winston");
var sugar = require("sugar");
var builder = require("botbuilder");
var doT = require("dot");
var utils = require("../utils");

module.exports = (bot, persona, datapoint, gmaps) => {

    var intent = "weather.accessory";

    bot.dialog(intent, [
        (session, results, next) => {
            session.send("A question about a weather accessory");
        },
        utils.storeAsPreviousIntent
    ]);

};