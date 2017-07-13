"use strict";

var winston = require("winston");
var utils = require("../utils");
var ua = require('universal-analytics');

/**
 * weather.detail
 *
 * When executed this will provide the user with a verbose weather forecast.
 * Previous intent must be a weather.x intent. This will then use the stored session.conversationData values
 * to return the weather.detail response.
 *
 * @param bot - bot to add intent to
 * @param persona - persona client
 * @param datapoint - datapoint client
 * @param gmaps - goolge maps client
 */
module.exports = (bot, persona) => {

    var intent = "weather.detail";

    bot.dialog(intent, [
        (session, results, next) => {
            winston.debug("[ %s ] intent matched [ %s ]", intent, session.message.text);
            ua(session.userData.ga_id, session.userData.uuid)
                .event({ec: "intent", ea: intent, el: session.message.text})
                .send();

            if (!session.conversationData.time_target || !session.conversationData.location) {
                winston.warn("[ %s ] matched but the time_target was [ %s ] and the location was [ %s ]", intent, session.conversationData.time_target, session.conversationData.location);
                session.cancelDialog();
                session.beginDialog("error.general");
            } else if (!session.conversationData.previous_intent.split(".")[0] === "weather") {
                winston.warn("[ %s ] matched but previous intent was [ %s ]", intent, session.conversationData.previous_intent);
                session.cancelDialog();
                session.beginDialog("error.general");
            }

            return next();
        },
        (session, results, next) => {
            var response = "";
            var model = {
                user: session.userData,
                location: session.conversationData.location,
                weather: session.conversationData.weather
            };

            response = persona.getResponse(intent, model);

            if (response && !(response === "")) {
                session.send(response);
                return next({response: intent});
            } else {
                session.send(persona.getResponse("error.general"));
                return session.endDialog();
            }
        },
        utils.storeAsPreviousIntent
    ]);

};
