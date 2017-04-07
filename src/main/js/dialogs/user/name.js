"use strict";

var builder = require("botbuilder");

module.exports = function (bot, persona) {

    var dialog = "user.name";

    bot.dialog(dialog, [
        function (session, results, next) {
            winston.debug("running dialog [ %s ]", dialog);
            builder.Prompts.text(session, 'What is your name?');
        },
        function(session, results, next) {
            session.userData.name = results.response;
            session.endDialog();
        }
    ]);
};