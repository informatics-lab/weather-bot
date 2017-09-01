"use strict";

var winston = require("winston");
var utils = require("../utils");
var builder = require("botbuilder");

module.exports = function (bot, persona) {

    var intent = "smalltalk.greeting";

    bot.dialog(intent, [
        (session, results, next) => {
            winston.debug("[ %s ] intent matched [ %s ]", intent, session.message.text);

            var model = {user: session.userData};
            var actions = [
                builder.CardAction.imBack(session, "What's the weather?", "What's the weather?"),
                builder.CardAction.imBack(session, "Will it rain today?", "Will it rain today?"),
                builder.CardAction.imBack(session, "What's the Met Office?", "What's the Met Office?"),
                builder.CardAction.imBack(session, "Help me", "Help me")
            ];

            var msg;
            if (!session.userData.greeted) {
                // this is the first time a user has spoken to us -
                // hero card greeting with the warning.
                session.send(persona.getResponse("smalltalk.warning", model, session));
                msg = persona.getResponse("smalltalk.welcome", model, session);
                session.userData.greeted = true;
            } else {
                //user has chatted previously - just standard hello with menu ui.
                msg = new builder.Message(session);
                var response = persona.getResponse(intent, model);
                msg.text(response);
            }
            msg.suggestedActions(builder.SuggestedActions.create(session, actions));
            session.send(msg);
            return next();
        },
        (session, results, next) => {
            return next({response: intent});
        },
        utils.storeAsPreviousIntent
    ]);
};