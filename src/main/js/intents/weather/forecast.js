"use strict";

var winston = require("winston");
var sugar = require("sugar");
var builder = require("botbuilder");
var doT = require("dot");

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
        (session, results, next) => {
            var locationRegex = /(?:(in|for)) (\w+)/g;
            var locationRegexResults = locationRegex.exec(results.response);
            if(locationRegexResults && locationRegexResults.length === 2) {
                session.conversationData.location = locationRegexResults[1];
            } else {
                session.conversationData.location = results.response;
            }

            gmaps.geocode(session.conversationData.location)
                .then((res)=> {
                    session.conversationData.gmaps = res;
                    return next();
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
            var timeTargetRegex = /(?=.*\bday\b)((?=.*\bafter\b)|(?=.*\bnext\b)).*/g;
            var timeTargetRegexResult = timeTargetRegex.exec(session.conversationData.time_target);
            var d;
            if(timeTargetRegexResult) {
                d = sugar.Date.addDays(sugar.Date.create(session.conversationData.time_target_date, {fromUTC: true}), 1);
            } else {
                d = sugar.Date.create(session.conversationData.time_target, {fromUTC: true});
            }
            var dStr = `${d.toISOString().substr(0, 10)}Z`;
            session.conversationData.time_target_date = dStr;

            var wx = session.conversationData.forecast.SiteRep.DV.Location.Period.filter(f => f.value === session.conversationData.time_target_date)[0];
            var dayWx = wx.Rep[0];

            var template = doT.template(persona.getResponse(intent));
            var response = template({wx: dayWx, location: session.conversationData.location, time_target: session.conversationData.time_target});

            winston.debug("response [ %s ]", response);

            session.send(response);
            session.endDialog();
        }
    ]);

};