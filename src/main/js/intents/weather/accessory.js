"use strict";

var winston = require("winston");
var sugar = require("sugar");
var utils = require("../utils");
var constants = require("../../constants");

/**
 * weather.accessory
 *
 * Responds to questions like 'will I need my coat' with a variable-certainty response.
 * Executes waterfall defined here and then forwards on to weather.accessory.<accessory_entity>
 * Uses the entities identified by LUIS otherwise will fallback to use the stored session.conversationData or
 * session.userData.
 *
 * @param bot - bot to add intent to
 * @param persona - persona client
 * @param datapoint - datapoint client
 * @param gmaps - goolge maps client
 */
module.exports = (bot, persona, datapoint, gmaps) => {

    var intent = "weather.accessory";

    bot.dialog(intent, [
        (session, results, next) => {
            winston.debug("[ %s ] intent matched [ %s ]", intent, session.message.text);
            ua(session.userData.ga_id, session.userData.uuid)
                .event({ec: "intent", ea: intent, el: session.message.text})
                .send();
            session.conversationData.luis = results;
            session.conversationData.intent = intent;
            return next();
            
            if (results && results.entities) {
                var timeTargetEntity = results.entities.filter(e => e.type === 'time_target')[0];
                if (timeTargetEntity) {
                    session.conversationData.time_target = timeTargetEntity.entity;
                }
                var locationEntity = results.entities.filter(e => e.type === 'location')[0];
                if (locationEntity) {
                    session.conversationData.location = locationEntity.entity;
                }
                var accessoryEntity = results.entities.filter(e => e.type === 'accessory')[0];
                if (accessoryEntity) {
                    session.conversationData.accessory = accessoryEntity.entity;
                }
            }
            if (!session.conversationData.accessory) {
                winston.warn("[ %s ] matched but there was no accessory for [ %s ]", intent, session.message.text);
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
                    session.beginDialog("prompt", {
                        key: "prompts.weather.accessory.location",
                        model: {user: session.userData}
                    });
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
                })
                .catch((err) => {
                    winston.warn(err);
                    session.send(persona.getResponse("error.data.not_returned"));
                    return session.endDialog();
                });
        },
        (session, results, next) => {
            var accessorySlug = sugar.String.underscore(session.conversationData.accessory.toLowerCase());
            var accessoryIntent = `${intent}.${accessorySlug}`;
            if (session.library.dialogs[accessoryIntent]) {
                session.beginDialog(accessoryIntent);
            } else {
                winston.warn("accessory [ %s ] did not match with any known accessories", session.conversationData.accessory);
                var unknown = `${intent}.unknown`;
                session.beginDialog(unknown);
            }
        },
        utils.storeAsPreviousIntent
    ]);

};