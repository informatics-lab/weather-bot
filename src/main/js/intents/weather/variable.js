"use strict";

var winston = require("winston");
var sugar = require("sugar");
var builder = require("botbuilder");
var doT = require("dot");
var utils = require("../utils");

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
                var wxVariableEntity = results.entities.filter(e => e.type === 'variable')[0];
                if (wxVariableEntity) {
                    session.conversationData.wxVariable = wxVariableEntity.entity;
                } else {
                    session.send(persona.getResponse("error"));
                    session.endDialog();
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
                    var today = sugar.Date.create("today", {fromUTC: true});
                    var tomorrow = sugar.Date.create("tomorrow", {fromUTC: true});
                    if (session.conversationData.time_target_dates && session.conversationData.time_target_dates.length === 1 &&
                        (session.conversationData.time_target_dates.includes(today.toISOString()) || session.conversationData.time_target_dates.includes(tomorrow.toISOString()))) {
                        return datapoint.get3HourlyDataForSiteId(res.location.id);
                    } else {
                        return datapoint.getDailyDataForSiteId(res.location.id);
                    }
                })
                .then((res) => {
                    session.conversationData.forecast = res;
                    return next();
                });
        },
        utils.storeAsPreviousIntent
    ]);

};