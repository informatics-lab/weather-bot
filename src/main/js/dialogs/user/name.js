"use strict";

var builder = require("botbuilder");
var winston = require("winston");

module.exports = function (bot, persona) {

    var dialog = "dialogs.user.name";

    bot.dialog(dialog, [
        function (session) {
            winston.debug("running dialog [ %s ]", dialog);
            builder.Prompts.text(session, persona.getResponse(dialog));
        },
        function(session, results) {
            session.userData.name = results.response;
            session.beginDialog("smalltalk.greeting");
        }
    ]);
};