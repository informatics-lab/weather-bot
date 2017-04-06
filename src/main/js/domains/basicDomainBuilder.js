"use strict";

var winston = require("winston");

module.exports = function (intent) {
    return function (intents, persona) {
        intents.matches(intent, [
            function (session, args, next) {
                winston.debug("[ %s ] intent matched [ %s ]", intent, session.message.text);
                var response = persona.getResponse(intent);
                winston.debug("response [ %s ]", response);
                session.send(response);
            }
        ]);
    };
};