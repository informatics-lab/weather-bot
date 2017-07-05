"use strict";

var winston = require("winston");
var sugar = require("sugar");
var builder = require("botbuilder");
var doT = require("dot");
var utils = require("../utils");
var constants = require("../../constants");
var ua = require('universal-analytics');

module.exports = (bot, persona, datapoint, gmaps) => {

    var intent = "weather.forecast";

    bot.dialog(intent, [
        (session, results, next) => {
            winston.debug("[ %s ] intent matched [ %s ]", intent, session.message.text);

            if (results && results.entities) {
                var timeTargetEntity = results.entities.filter(e => e.type === 'time_target')[0];
                if (timeTargetEntity) {
                    session.conversationData.time_target = timeTargetEntity.entity;
                }
                var locationEntity = results.entities.filter(e => e.type === 'location')[0];
                if (locationEntity) {
                    session.conversationData.location = locationEntity.entity;
                }
            }
            if (!session.conversationData.time_target) {
                session.conversationData.time_target = "today";
            }

            if (session.conversationData.location) {
                return next({response: session.conversationData.location});
            }
            if (session.userData.location) {
                return next({response: session.userData.location});
            }

            session.beginDialog("prompt", {key: "prompts.user.location", model: {pre: "For"}});

        },
        utils.sanitze.location,
        (session, results, next) => {
            session.conversationData.location = results.response;
            return next();
        },
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
            datapoint.getDailyDataForLatLng(session.conversationData.gmaps.results[0].geometry.location.lat, session.conversationData.gmaps.results[0].geometry.location.lng)
                .then((res) => {
                    session.conversationData.forecast = res;
                    return next();
                })
                .catch((err) => {
                  winston.warn(err);
                  session.send(persona.getResponse("error.data.not_returned"));
                  return session.endDialog();
                })
        },
        (session, results, next) => {
            return next({response: session.conversationData.time_target})
        },
        utils.sanitze.time_target,
        (session, results, next) => {
            session.conversationData.time_target_dates = results.response;
            return next();
        },
        (session, results, next) => {
            var response = "";

            var template = doT.template(persona.getResponse("weather.location"));
            response = response + template({location: sugar.String.capitalize(session.conversationData.location, true, true)});

            session.conversationData.time_target_dates.forEach((date) => {

                var day = `${date.substr(0, 10)}Z`;
                var wx = session.conversationData.forecast.SiteRep.DV.Location.Period.filter(f => day === f.value);

                var template = doT.template(persona.getResponse("weather.date"));
                response = response + template({date: constants.DATE_TO_DATE_OBJECT(date)});

                if (wx && !(wx.length === 0)) {
                    wx = wx[0].Rep[0];

                    var template = doT.template(persona.getResponse(intent));
                    response = response + template({model: constants.DAILY_DATAPOINT_TO_MODEL(wx)});

                } else {
                    response = response + persona.getResponse("weather.no_data");
                }

            });

            if (response && !(response === "")) {
                ua(session.userData.ga_id, session.userData.uuid)
                    .event({ec: "intent", ea: intent, el: session.message.text})
                    .send();
                session.send(response);
                return next({response: "weather.forecast"});
            } else {
                session.send(persona.getResponse("error.general"));
                return session.endDialog();
            }
        },
        utils.storeAsPreviousIntent
    ]);

};
