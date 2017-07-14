"use strict";

var winston = require("winston");
var sugar = require("sugar");
var utils = require("../utils");
var constants = require("../../constants");

/**
 * weather.variable
 *
 * Responds to questions like 'will it rain tomorrow' with a variable-certainty response.
 * Executes waterfall defined here and then forwards on to weather.variable.<variable_entity>
 * Uses the entities identified by LUIS otherwise will fallback to use the stored session.conversationData or
 * session.userData.
 *
 * @param bot - bot to add intent to
 * @param persona - persona client
 * @param datapoint - datapoint client
 * @param gmaps - goolge maps client
 */
module.exports = (bot, persona, datapoint, gmaps) => {

    var intent = "weather.variable";

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
        utils.capture.variable,
        (session, results, next) => {
            gmaps.geocode(session.conversationData.location)
                .then((res)=> {
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
            datapoint.getHourlyDataForLatLng(session.conversationData.gmaps.results[0].geometry.location.lat, session.conversationData.gmaps.results[0].geometry.location.lng)
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
            var variableSlug = sugar.String.underscore(session.conversationData.variable.toLowerCase());
            var variableIntent = `${intent}.${variableSlug}`;
            if (session.library.dialogs[variableIntent]) {
                session.beginDialog(variableIntent);
            } else {
                winston.warn("variable [ %s ] did not match with any known variable", session.conversationData.variable);
                var unknown = `${intent}.unknown`;
                session.beginDialog(unknown);
            }
        },
        utils.storeAsPreviousIntent
    ]);

};