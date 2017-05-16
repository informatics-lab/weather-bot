"use strict";

var winston = require("winston");
var ua = require('universal-analytics');

module.exports = function (intent) {
    return function (bot, persona) {
        bot.dialog(intent, [
             (session) => {
                winston.debug("[ %s ] intent matched [ %s ]", intent, session.message.text);
                var response = persona.getResponse(intent, session);
                if (typeof(response) === "string") {
                    winston.debug("response [ %s ]", response);
                } else {
                    winston.debug("returning object as response");
                }
                var visitor = ua(session.userData.ga_id, session.userData.uuid);
                visitor.event({ec: "intent", ea: intent, el: session.message.text}).send();
                session.send(response);
                return session.endDialog();
            }
        ])
    };
};
