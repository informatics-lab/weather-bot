"use strict";

var winston = require("winston");

module.exports = function (bot, persona) {
    
    var intent = "smalltalk.greeting";
    
    bot.dialog(intent, [
        (session) => {
            winston.debug("[ %s ] intent matched [ %s ]", intent, session.message.text);
            if(session.userData.name) {
                var response = `${persona.getResponse(intent)} ${session.userData.name}`;
                winston.debug("response [ %s ]", response);
                session.send(response);
                session.endDialog();
            } else {
                var response = persona.getResponse(intent);
                winston.debug("response [ %s ]", response);
                session.send(response);
                session.beginDialog("dialogs.user.name");
            }
        }
    ])
};