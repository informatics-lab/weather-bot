"use strict";

var winston = require("winston");
var convData = require('./utils').convData;

module.exports = function(bot, persona) {

    var intent = "repeat";

    bot.dialog(intent, [
        (session, results, next) => {
            winston.info("[ %s ] intent matched [ %s ]", intent, session.message.text);
            var previous = convData.get(session, "previous_intent");
            if (previous) {
                convData.addWithExpiry(session, "isRepeat", true, convData.MINUTE * 3);
                return session.beginDialog(previous, results);
            } else {
                convData.deleteItem(session, "isRepeat");
                session.send(persona.getResponse("error.nonsense"));
                return session.endDialog();
            }
        },
        (session, results, next) => {
            convData.deleteItem(session, "isRepeat");
            session.endDialog();
        }
    ]);

};