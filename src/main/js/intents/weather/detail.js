"use strict";

var winston = require("winston");
var sugar = require("sugar");
var builder = require("botbuilder");
var doT = require("dot");
var utils = require("../utils");
var constants = require("../../constants");
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
module.exports = (bot, persona, datapoint, gmaps) => {

    var intent = "weather.detail";

    bot.dialog(intent, [
        (session, results, next) => {
            winston.debug("[ %s ] intent matched [ %s ]", intent, session.message.text);

            if (!session.conversationData.time_target || !session.conversationData.location) {
                winston.warn("[ %s ] matched but the time_target was [ %s ] and the location was [ %s ]", intent, session.conversationData.time_target, session.conversationData.location);
                session.cancelDialog();
                session.beginDialog("error.general");
            } else if (!session.conversationData.previous_intent.split(".")[0] === "weather") {
                winston.warn("[ %s ] matched but previous intent was [ %s ]", intent, session.conversationData.previous_intent);
                session.cancelDialog();
                session.beginDialog("error.general");
            }

            return next({response: session.conversationData.location});
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
            datapoint.getNearestSiteToLatLng(session.conversationData.gmaps.results[0].geometry.location)
                .then((res) => {
                    session.conversationData.site = res;
                    return datapoint.getDailyDataForSiteId(res.location.id);
                })
                .then((res) => {
                    session.conversationData.forecast = res;
                    return next();
                });
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
            var model = {};

            model["location"] = session.conversationData.location;

            session.conversationData.time_target_dates.forEach((date) => {

                var day = `${date.substr(0, 10)}Z`;
                var wx = session.conversationData.forecast.SiteRep.DV.Location.Period.filter(f => day === f.value);

                model["date"] = constants.DATE_TO_DATE_OBJECT(date);

                if (wx && !(wx.length === 0)) {
                    wx = wx[0].Rep[0];
                    model = Object.assign(model, constants.DAILY_DATAPOINT_TO_MODEL(wx));

                    var template = doT.template(persona.getResponse(intent));
                    response = response + template({model: model});

                } else {
                    response = response + persona.getResponse("weather.no_data");
                }

            });

            if (response && !(response === "")) {
                ua(session.userData.ga_id, session.userData.uuid)
                    .event({ec: "intent", ea: intent, el: session.message.text})
                    .send();
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
