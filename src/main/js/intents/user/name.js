"use strict";

var winston = require("winston");
var doT = require("dot");

module.exports = function (bot, persona) {

    var intent = "user.name";

    bot.dialog(intent, [
        (session, results) => {
            winston.debug("[ %s ] intent matched [ %s ]", intent, session.message.text);

            if(!results.entities || results.entities.length === 0) {
                session.beginDialog("dialogs.user.name");
            } else {
                session.userData.name = results.entities[0].entity;

                var template = doT.template(persona.getResponse(intent));
                var response = template({name: session.userData.name});

                winston.debug("response [ %s ]", response);
                session.send(response);
                session.endDialog();
            }
        }
    ])
};