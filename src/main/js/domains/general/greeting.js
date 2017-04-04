"use strict";

var winston = require("winston");

module.exports = function (bot, persona) {
    
    bot.dialog("greeting", [
        function (session, results) {
            winston.info("greeting intent matched");
            session.send(persona.getResponse("greeting"));
        }
    ]).triggerAction({
        matches: "greeting"
    });
    
};