"use strict";

var winston = require("winston");
var convData = require('./utils').convData;


//TODO: not really a weather specific intent possibly move
module.exports = function(bot, persona) {

    var intent = "repeat";

    bot.dialog(intent, [
        function(session, results, next) {
            winston.info("[ %s ] intent matched [ %s ]", intent, session.message.text);
            if (session.conversationData.previous_intent) {
                convData.addWithExpiry(session, 'isRepeat', true, convData.MINUTE * 3);
                session.beginDialog(session.conversationData.previous_intent, results);
            } else {
                convData.deleteItem(session, 'isRepeat');
                session.send(persona.getResponse("error.general"));
                session.endDialog();
            }
        },
        function(session, results, next) {
            convData.deleteItem(session, 'isRepeat');
            session.endDialog();
        }
    ]);

};