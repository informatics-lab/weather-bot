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
                .event({ ec: "intent", ea: intent, el: session.message.text })
                .send();
            session.conversationData.luis = results;
            session.conversationData.intent = intent;
            //here!!!
            var time_target = utils.convData.get(session, 'time_target');
            var location = utils.convData.get(session, 'location');
            if (!time_target || !location) {
                winston.warn("[ %s ] matched but the time_target was [ %s ] and the location was [ %s ]", intent, time_target, location);
                session.cancelDialog();
                session.send(persona.getResponse("error.nonsense"));
                return session.endDialog();
            }
            var previous = utils.convData.get(session, "previous_intent");
            if (previous && !(previous.split(".")[0] === "weather")) {
                winston.warn("[ %s ] matched but previous intent was [ %s ]", intent, session.conversationData.previous_intent);
                session.cancelDialog();
                session.send(persona.getResponse("error.nonsense"));
                return session.endDialog();
            }
            return next();
        },
        (session, results, next) => {
            var response = "";
            var model = {
                user: session.userData,
                location: utils.convData.get(session, "location"),
                date: {
                    day_string: utils.convData.get(session, "time_target").text
                }
            };

            if (!session.conversationData.weather || session.conversationData.weather.length == 0) {
                session.send(persona.getResponse("weather.no_data"));
                return next({ response: baseIntent });
            }

            model.weather = session.conversationData.weather;

            if(!(utils.convData.get(session, "previous_intent") === "weather.forecast") &&
                !(utils.convData.get(session, "previous_intent") === "weather.detail")) {
                session.cancelDialog();
                session.beginDialog("weather.forecast");
            } else {
                response = persona.getResponse(intent, model);

                if (response && !(response === "")) {
                    session.send(response);
                    return next({response: intent});
                } else {
                    session.send(persona.getResponse("error.general"));
                    return session.endDialog();
                }
            }
        },
        utils.storeAsPreviousIntent
    ]);

};