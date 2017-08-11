"use strict";

var winston = require("winston");
var convData = require('./utils').convData;

module.exports = function(bot, persona) {

    var intent = "repeat";

    bot.dialog(intent, [
        (session, results, next) => {
            winston.info("[ %s ] intent matched [ %s ]", intent, session.message.text);
            var previous = utils.convData.get(session, "previous_intent");
            if (previous) {
                convData.addWithExpiry(session, 'isRepeat', true, convData.MINUTE * 3);
                session.beginDialog(previous, results);
                next();
            } else {
                convData.deleteItem('isRepeat');
                session.send(persona.getResponse("error.nonsense"));
                session.endDialog();
            }
        },
        (session, results, next) => {
            convData.deleteItem('isRepeat');
        }
    ]);

};