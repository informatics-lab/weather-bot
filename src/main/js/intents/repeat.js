"use strict";

var winston = require("winston");
var convData = require('./utils').convData;
module.exports = function(bot, persona) {

    var intent = "repeat";

    bot.dialog(intent, [
        function(session, results, next) {
            winston.info("[ %s ] intent matched [ %s ]", intent, session.message.text);
            if (session.conversationData.previous_intent) {
                convData.addWithExpiry(session, 'isRepeat', true, convData.MINUTE * 3);
                session.beginDialog(session.conversationData.previous_intent, results);
                next();
            } else {
                session.send(persona.getResponse("error.general"));
                session.endDialog();
            }
        },
        function(session, results, next) {
            convData.deleteItem('isRepeat');
        }
    ]);

};