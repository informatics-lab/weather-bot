"use strict";

var builder = require("botbuilder");
var winston = require("winston");

module.exports = function (bot, persona, recognizer) {

    var intent = "none";

    bot.dialog('/', new builder.IntentDialog({recognizers: [recognizer]})
        .onDefault(function (session) {
            session.beginDialog(intent)
        })
    );

    bot.dialog(intent, function (session) {
        winston.info("[ %s ] intent matched [ %s ]", intent, session.message.text);
        var response = persona.getResponse(intent);
        winston.debug("response [ %s ]", response);
        session.send(response);
        session.endDialog();
    })

};