"use strict";

var winston = require("winston");

//TODO not really a weather specific intent possibly move
module.exports = function (bot, persona) {

    var intent = "repeat";

    bot.dialog(intent, [
        function (session, results) {
            winston.info("[ %s ] intent matched [ %s ]", intent, session.message.text);
            if(session.conversationData.previous_intent) {
                session.beginDialog(session.conversationData.previous_intent, results);
            } else {
                session.send(persona.getResponse("error.general"));
                session.endDialog();
            }
        }]
    );

};