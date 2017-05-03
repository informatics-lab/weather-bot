"use strict";

var winston = require("winston");
var sugar = require("sugar");
var builder = require("botbuilder");
var doT = require("dot");
var utils = require("../utils");
var constants = require("../../constants");

module.exports = (bot, persona, datapoint, gmaps) => {

    var intent = "weather.variable";

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
                var variableEntity = results.entities.filter(e => e.type === 'variable')[0];
                if (variableEntity) {
                    session.conversationData.variable = variableEntity.entity;
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
            return next({response: session.conversationData.variable})
        },
        utils.translate.variable,
        (session, results, next) => {
            session.conversationData.wxVariable = results.response;
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

                    session.conversationData.wxVariable.forEach((variable) => {
                        var model = {};

                        variable.datapoint.forEach((phenomena) => {
                            var modelKey = phenomena.id;
                            var wxKey = phenomena.index.daily.day;
                            if (phenomena.id === "weather_type") {
                                model[modelKey] = constants.WX_TYPE_INDEX_TO_WX_TYPE_STRING(wx[wxKey]);
                            } else {
                                model[modelKey] = wx[wxKey];
                            }
                        });
                        
                        var template = doT.template(persona.getResponse(`${intent}.${variable.name}`));
                        response = response + template({model: model});

                    });

                } else {
                    response = response + persona.getResponse("weather.no_data");
                }

            });

            if (response && !(response === "")) {
                session.send(response);
                return next();
            } else {
                session.send(persona.getResponse("error"));
                return session.endDialog();
            }
        },
        utils.storeAsPreviousIntent
    ]);

};