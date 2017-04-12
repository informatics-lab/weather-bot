"use strict";

var winston = require("winston");
var doT = require("dot");

module.exports = function (bot, persona) {

    var intent = "smalltalk.farewell";

    bot.dialog(intent, [
        (session) => {
            winston.debug("[ %s ] intent matched [ %s ]", intent, session.message.text);

            var template = doT.template(persona.getResponse(intent));
            var response = template({name: session.userData.name});

            winston.debug("response [ %s ]", response);
            session.send(response);
            session.endDialog();
        }
    ])
};