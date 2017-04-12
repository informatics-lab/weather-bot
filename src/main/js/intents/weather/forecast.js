"use strict";

var winston = require("winston");

module.exports = (bot, persona) => {

    var intent = "weather.forecast";

    bot.dialog(intent, [
        (session, results, next) => {
            winston.debug("[ %s ] intent matched [ %s ]", intent, session.message.text);
            if (!session.userData.location && ( !results.entities || results.entities.length === 0)) {
                session.beginDialog("dialogs.user.location");
            } else {
                next();
            }
        },
        (session, results) => {
            session.send("balls");
        }
    ]);

};