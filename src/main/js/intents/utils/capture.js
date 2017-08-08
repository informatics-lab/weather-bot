"use strict";

var sugar = require("sugar");
var winston = require("winston");
var actionUtils = require('./actionUtils');
var convData = require('./convData');

function timeEntityToMsgText(entity) {
    entity = entity.entity;
    if (entity.search(/weekend/) >= 0) {
        return "at the weekend";
    }
    if (entity.search(/today/i) >= 0) {
        return entity;
    }
    if (entity.search(/((this)|(next)|(comming))/i) === 0) {
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
                convData.addWithExpiry(session, 'time_target', datetimeEntity);
            }
        }

        var time_target = convData.get(session, 'time_target');
        if (!time_target) {
            time_target = {
                "entity": "today",
                "type": "builtin.datetimeV2.datetimerange",
                "resolution": {
                    "values": [{
                        "type": "datetimerange",
                        "start": sugar.Date.format(sugar.Date.create("now", { setUTC: true }), "{yyyy}-{MM}-{dd} {HH}:{mm}:{ss}"),
                        "end": sugar.Date.format(sugar.Date.endOfDay(sugar.Date.create("now", { setUTC: true })), "{yyyy}-{MM}-{dd} {HH}:{mm}:{ss}")
                    }]
                }
            };
        }
        time_target.text = timeEntityToMsgText(time_target);
        convData.addWithExpiry(session, 'time_target', time_target, ttl);
        return next();
    },

    location: (session, results, next) => {
        winston.debug("capturing location");
        var luis = session.conversationData.luis;
        if (luis && luis.entities) {
            var locationEntity = luis.entities.filter(e => e.type === "location")[0];
            if (locationEntity) {
                convData.addWithExpiry(session, 'location', locationEntity.entity);
            }
        }
        var location = convData.get(session, 'location');
        if (!location) {

            session.beginDialog("prompt", {
                key: `prompts.${session.conversationData.intent}.location`,
                convDataKey: "location",
                model: { user: session.userData }
            });
        } else {
            return next();
        }
    },

    accessory: (session, results, next) => {
        winston.debug("capturing accessory");
        var luis = session.conversationData.luis;
        var accessory = null;
        if (convData.get(session, 'isRepeat')) {
            accessory = convData.get(session, 'accessory');
        }
        if (luis && luis.entities) {
            var accessoryEntity = luis.entities.filter(e => e.type === "accessory")[0];
            if (accessoryEntity) {
                accessory = accessoryEntity.entity;
            }
        }
        if (!accessory) {
            winston.warn("no accessory found in [ %s ]", session.message.text);
            var unknown = "weather.accessory.unknown";
            session.cancelDialog();
            session.beginDialog(unknown);
        }
        convData.addWithExpiry(session, 'accessory', accessory, convData.HOUR / 4);
        return next();
    },

    action: (session, results, next) => {
        winston.debug("capturing action");
        var luis = session.conversationData.luis;
        var action = null;
        var action_type = null;
        if (convData.get(session, 'isRepeat')) {
            action = convData.get(session, 'action');
            action_type = convData.get(session, 'action_type');
        }
        if (luis && luis.entities) {
            var actionEntity = luis.entities.filter(e => e.type === "action")[0];
            if (actionEntity) {
                action = actionEntity.entity;
                action_type = actionUtils.action_type(actionEntity.entity);
            }
        }
        if (!action_type) {
            action_type = actionUtils.UNKNOWN;
        }
        convData.addWithExpiry(session, 'action', action, convData.HOUR / 4);
        convData.addWithExpiry(session, 'action_type', action_type, convData.HOUR / 4);
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