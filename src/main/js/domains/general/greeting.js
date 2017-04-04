"use strict";

var winston = require("winston");

module.exports = function (bot) {
    
    bot.dialog("greeting", [
        function (session, results) {
            winston.info("greeting intent matched");
            session.send("hello");
        }
    ]).triggerAction({
        matches: "greeting"
    });
    
};