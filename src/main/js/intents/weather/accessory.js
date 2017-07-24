"use strict";

var winston = require("winston");
var sugar = require("sugar");
var utils = require("../utils");
var constants = require("../../constants");

/**
 * weather.accessory
 *
 * Responds to questions like 'will I need my coat' with a variable-certainty response.
 * Executes waterfall defined here and then forwards on to weather.accessory.<accessory_entity>
 * Uses the entities identified by LUIS otherwise will fallback to use the stored session.conversationData or
 * session.userData.
 *
 * @param bot - bot to add intent to
 * @param persona - persona client
 * @param datapoint - datapoint client
 * @param gmaps - goolge maps client
 */
module.exports = (bot, persona, datapoint, gmaps) => {

    var intent = "weather.accessory";

    bot.dialog(intent, [
        (session, results, next) => {
            winston.debug("[ %s ] intent matched [ %s ]", intent, session.message.text);
            session.conversationData.luis = results;
            session.conversationData.intent = intent;
            return next();
        },
        utils.capture.location,
        utils.sanitze.location,
        utils.capture.datetimeV2,
        utils.sanitze.datetimeV2,
        utils.capture.accessory,
        (session, results, next) => {
            gmaps.geocode(session.conversationData.location)
                .then((res) => {
                    session.conversationData.gmaps = res;
                    return next();
                })
                .catch((err) => {
                    winston.warn(err);
                    session.send(persona.getResponse("error.location.not_uk"));
                    return session.endDialog();
                });
        },
        (session, results, next) => {
            var end = session.conversationData.time_target.range.toDT;
            datapoint.getMethodForTargetTime(end)(session.conversationData.gmaps.results[0].geometry.location.lat, session.conversationData.gmaps.results[0].geometry.location.lng)
                .then((res) => {
                    session.conversationData.datapoint = res;
                    return next();
                })
                .catch((err) => {
                    winston.warn(err);
                    session.send(persona.getResponse("error.data.not_returned"));
                    return session.endDialog();
                })
        },
        utils.sanitze.weather,
        utils.summarize.weather,
        (session, results, next) => {
            var accessorySlug = sugar.String.underscore(session.conversationData.accessory.toLowerCase());
            var accessoryIntent = `${intent}.${accessorySlug}`;
            if (session.library.dialogs[accessoryIntent]) {
                session.beginDialog(accessoryIntent);
            } else {
                winston.warn("accessory [ %s ] did not match with any known accessories", session.conversationData.accessory);
                var unknown = `${intent}.unknown`;
                session.beginDialog(unknown);
            }
        },
        utils.storeAsPreviousIntent
    ]);

};