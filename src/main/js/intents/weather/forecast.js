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
            session.conversationData.intent = intent;
            return next();
        },
        utils.capture.datetimeV2,
        utils.sanitze.datetimeV2,
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
        utils.sanitze.weather,
        utils.summarize.weather,
        (session, results, next) => {
            var response = "";
            var model = {
                user: session.userData,
                location: session.conversationData.location,
                date:{
                    day_string : session.conversationData.time_target.entity
                }
            };

            if(!session.conversationData.weather || session.conversationData.weather.length == 0) {
                session.send(persona.getResponse("weather.no_data"));
                return next({response: baseIntent});
            }

            model.weather = session.conversationData.weather;
            
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
