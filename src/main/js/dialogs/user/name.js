"use strict";

var builder = require("botbuilder");
var winston = require("winston");

module.exports = function (bot, persona) {

    var dialog = "user.name";

    bot.dialog(dialog, [
        function (session) {
            winston.debug("running dialog [ %s ]", dialog);
            builder.Prompts.text(session, 'What is your name?');
        },
        function(session, results) {
            session.userData.name = results.response;
            session.beginDialog("greeting");
        }
    ]);
};