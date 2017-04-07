"use strict";

var winston = require("winston");

module.exports = function (bot, persona) {

    var intent = "none";

    bot.dialog(intent, [
        function (session) {
            winston.info("[ %s ] intent matched [ %s ]", intent, session.message.text);
            var response = persona.getResponse(intent);
            winston.debug("response [ %s ]", response);
            session.send(response);
            session.endDialog();
        }]
    );

};