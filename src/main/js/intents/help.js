"use strict";

var builder = require("botbuilder");
var winston = require("winston");

module.exports = function (bot, persona) {

    var intent = "help";

    bot.dialog(intent, [
        function (session) {
            winston.debug("[ %s ] intent matched [ %s ]", intent, session.message.text);
            var response = persona.getResponse(intent);
            
            winston.debug("response [ %s ]", response);
            session.send(response);
            // session.endDialog();
            session.beginDialog("user.name");
        }]
    );

};