"use strict";

var winston = require("winston");
var sugar = require("sugar");
var utils = require("../utils");
var constants = require("../../constants");
var ua = require("universal-analytics");


/**
 * weather.forecast
 *
 * When executed this intent will attempt to give the user a brief forecast.
 * Uses the entities identified by LUIS otherwise will fallback to use the stored session.conversationData or
 * session.userData to return weather.forecast response.
 *
 * @param bot - bot to add intent to
 * @param persona - persona client
 * @param datapoint - datapoint client
 * @param gmaps - goolge maps client
 */
module.exports = (bot, persona, datapoint, gmaps) => {

    var intent = "weather.forecast";

    bot.dialog(intent, [
        (session, results, next) => {
            winston.debug("[ %s ] intent matched [ %s ]", intent, session.message.text);
            ua(session.userData.ga_id, session.userData.uuid)
                .event({ec: "intent", ea: intent, el: session.message.text})
                .send();
            session.conversationData.luis = results;
            return next();
        },
        utils.capture.time_target,
        utils.sanitze.time_target,
        utils.capture.location,
        utils.sanitze.location,
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
        //TODO
        // parse the time_target and condense forecast into just the times we need -
        // not worth doing yet as changing the datetime recognition to use luis' built in functionality.
        utils.summarize.weather,
        (session, results, next) => {
            var response = "";
            var model = {
                user: session.userData,
                location: session.conversationData.location,
                weather: session.conversationData.weather
            };

            response = response + persona.getResponse(intent, model);

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
