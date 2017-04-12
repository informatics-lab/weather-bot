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
                    return next({response: locationEntity.entity});
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
            session.conversationData.location = results.response;
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
            var d = sugar.Date.create(session.conversationData.time_target);
            var dStr = `${d.toISOString().substr(0, 10)}Z`;
            var wx = session.conversationData.forecast.SiteRep.DV.Location.Period.filter(f => f.value === dStr)[0];
            var dayWx = wx.Rep[0];
            
            var template = doT.template(persona.getResponse(intent));
            var response = template(dayWx);

            winston.debug("response [ %s ]", response);
            
            session.send(response);
            session.endDialog();
        }
    ]);

};