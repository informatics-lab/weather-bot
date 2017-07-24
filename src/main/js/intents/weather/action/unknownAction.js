"use strict";

var winston = require("winston");
var ua = require("universal-analytics");
var basicIntentBuilder = require("../../basicIntentBuilder");
var actionUtils = require('../../utils/actionUtils');
var utils = require('../../utils');


var intent = `weather.action.${actionUtils.UNKNOWN}`;
var unknownIntent = function(bot, persona) {
    bot.dialog(intent, [
        (session, results, next) => {
            winston.debug("[ %s ] intent matched [ %s ]", intent, session.message.text);
            var model = { user: session.userData };
            var response = persona.getResponse(intent, model, session);
            var visitor = ua(session.userData.ga_id, session.userData.uuid);
            visitor.event({ ec: "intent", ea: intent, el: session.message.text }).send();
            session.send(response);
            return next({ response: intent });
        },
        (session, results, next) => {
            session.beginDialog("weather.forecast");
        },
        utils.storeAsPreviousIntent
    ]);
};

module.exports = unknownIntent;