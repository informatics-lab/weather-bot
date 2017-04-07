"use strict";

var winston = require("winston");

module.exports = function (intent) {
    return function (bot, persona) {
        bot.dialog(intent, [
            function (session) {
                winston.debug("[ %s ] intent matched [ %s ]", intent, session.message.text);
                var response = persona.getResponse(intent);
                winston.debug("response [ %s ]", response);
                session.send(response);
                session.endDialog();
            }
        ])
    };
};