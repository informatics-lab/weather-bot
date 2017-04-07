"use strict";

module.exports = function (bot, persona) {

    var dialog = "user.name";

    bot.dialog(dialog, [
        function (session, results, next) {
            winston.debug("running acquisition [ %s ]", dialog);
            bot.builder.Prompts.text(session, 'Hi! What is your name?');
        },
        function(session, results, next) {
            session.userData.name = results.response;
            session.endDialog();
        }
    ]);
};