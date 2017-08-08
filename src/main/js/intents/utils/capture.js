"use strict";

var sugar = require("sugar");
var winston = require("winston");
var actionUtils = require('./actionUtils');

//TODO potentially move this function to somewhere more appropriate.
function timeEntityToMsgText(entity) {
    entity = entity.entity;
    if (entity.search(/weekend/) >= 0) {
        return "at the weekend";
    }
    if (entity.search(/today/i) >= 0) {
        return entity;
    }
    if (entity.search(/tomorrow/i) >= 0) {
        return entity;
    }
    if (entity.search(/((this)|(next)|(coming))/i) === 0) {
        return entity;
    }
    return "on " + entity;
}

module.exports = {

    /**
     * captures the luis builtin entity datetimeV2
     */
    datetimeV2: (session, results, next) => {
        winston.debug("capturing datetimeV2");
        var luis = session.conversationData.luis;
        if (luis && luis.entities) {
            var datetimeEntity = luis.entities.filter(e => e.type.includes("datetimeV2"))[0];
            if (datetimeEntity) {
                session.conversationData.time_target = datetimeEntity;
            }
        }
        // TODO: record when we stored the datetime and throw away if older than say 1h.
        // TODO: We have to guess at the users timezone. Let's assume it's the same as the servers.
        if (!session.conversationData.time_target) {


            session.conversationData.time_target = {
                "entity": "today",
                "type": "builtin.datetimeV2.datetimerange",
                "resolution": {
                    "values": [{
                        "type": "datetimerange",
                        "start": sugar.Date.format(sugar.Date.create("now", {setUTC: true}), "{yyyy}-{MM}-{dd} {HH}:{mm}:{ss}"),
                        "end": sugar.Date.format(sugar.Date.endOfDay(sugar.Date.create("now", {setUTC: true})), "{yyyy}-{MM}-{dd} {HH}:{mm}:{ss}")
                    }]
                }
            };
        }
        session.conversationData.time_target.text = timeEntityToMsgText(session.conversationData.time_target);
        return next();
    },

    location: (session, results, next) => {
        winston.debug("capturing location");
        var luis = session.conversationData.luis;
        if (luis && luis.entities) {
            var locationEntity = luis.entities.filter(e => e.type === "location")[0];
            if (locationEntity) {
                session.conversationData.location = locationEntity.entity;
            }
        }
        if (!session.conversationData.location) {

            session.beginDialog("prompt", {
                key: `prompts.${session.conversationData.intent}.location`,
                sessionDataKey: "conversationData.location",
                model: { user: session.userData }
            });
        } else {
            return next();
        }
    },

    accessory: (session, results, next) => {
        winston.debug("capturing accessory");
        var luis = session.conversationData.luis;
        if (luis && luis.entities) {
            var accessoryEntity = luis.entities.filter(e => e.type === "accessory")[0];
            if (accessoryEntity) {
                session.conversationData.accessory = accessoryEntity.entity;
            }
        }
        if (!session.conversationData.accessory) {
            winston.warn("no accessory found in [ %s ]", session.message.text);
            var unknown = "weather.accessory.unknown";
            session.cancelDialog();
            session.beginDialog(unknown);
        }
        return next();
    },

    action: (session, results, next) => {
        winston.debug("capturing action");
        var luis = session.conversationData.luis;
        // Clear previous actions. We don't want to remember between conversations
        session.conversationData.action = null;
        session.conversationData.action_type = null;
        if (luis && luis.entities) {
            var actionEntity = luis.entities.filter(e => e.type === "action")[0];
            if (actionEntity) {
                session.conversationData.action = actionEntity.entity;
                session.conversationData.action_type = actionUtils.action_type(actionEntity.entity);
            }
        }
        if (!session.conversationData.action_type) {
            session.conversationData.action_type = actionUtils.UNKNOWN;
        }
        return next();
    },

    variable: (session, results, next) => {
        winston.debug("capturing variable");
        var luis = session.conversationData.luis;
        if (luis && luis.entities) {
            var variableEntity = luis.entities.filter(e => e.type === "variable")[0];
            if (variableEntity) {
                session.conversationData.variable = variableEntity.entity;
            }
        }
        if (!session.conversationData.variable) {
            winston.warn("no variable found in [ %s ]", session.message.text);
            var unknown = "weather.variable.unknown";
            session.cancelDialog();
            session.beginDialog(unknown);
        }
        return next();
    }

};