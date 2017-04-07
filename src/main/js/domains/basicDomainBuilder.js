"use strict";

var winston = require("winston");

module.exports = function (intent) {
    return function (bot, persona) {
        bot.dialog(intent, [
            function (session, args, next) {
                winston.debug("[ %s ] intent matched [ %s ]", intent, session.message.text);
                var response = persona.getResponse(intent);
                winston.debug("response [ %s ]", response);
                session.send(response);
            }
        ]).triggerAction({
            matches: intent
        });
    };
};