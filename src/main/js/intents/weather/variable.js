"use strict";

var winston = require("winston");
var sugar = require("sugar");
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
            if (!session.conversationData.variable) {
                winston.warn("[ %s ] matched but there was no variable for [ %s ]", intent, session.message.text);
                var unknown = `${intent}.unknown`;
                session.cancelDialog();
                session.beginDialog(unknown);
            } else {
                if (!session.conversationData.time_target) {
                    session.conversationData.time_target = "today";
                }
                if (session.conversationData.location) {
                    return next({response: session.conversationData.location});
                } else if (session.userData.location) {
                    return next({response: session.userData.location});
                } else {
                    session.beginDialog("prompt", {key: "prompts.user.location", model: {pre: "For"}});
                }
            }
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
            var variableSlug = sugar.String.dasherize(session.conversationData.variable.toLowerCase());
            var variableIntent = `${intent}.${variableSlug}`;
            if (session.library.dialogs[variableIntent]) {
                session.beginDialog(variableIntent);
            } else {
                winston.warn("variable [ %s ] did not match with any known variable", session.conversationData.variable);
                var unknown = `${intent}.unknown`;
                session.beginDialog(unknown);
            }
        },
        utils.storeAsPreviousIntent
    ]);

};