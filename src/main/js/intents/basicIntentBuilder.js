"use strict";

var winston = require("winston");

module.exports = function (intent) {
    return function (bot, persona) {
        bot.dialog(intent, [
             (session) => {
                winston.debug("[ %s ] intent matched [ %s ]", intent, session.message.text);
                var response = persona.getResponse(intent);
                if (typeof(response) === "string") {
                    winston.debug("response [ %s ]", response);
                } else {
                    winston.debug("returning object as response");
                }
                session.userData.visitor.event({ec: "intent", ea: intent, el: session.message.text}).send()
                session.send(response);
                return session.endDialog();
            }
        ])
    };
};
