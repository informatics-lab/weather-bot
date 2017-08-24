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


            if (!session.userData.greeted) {
                // this is the first time a user has spoken to us -
                // hero card greeting with the warning.
                session.send(persona.getResponse("smalltalk.welcome", model, session));
                session.sendTyping();
                session.delay(750);
                session.userData.greeted = true;
            }

            var msg = new builder.Message(session);
            var response = persona.getResponse(intent, model);
            var actions = [
                builder.CardAction.imBack(session, "weather forecast", "What's the weather?"),
                builder.CardAction.imBack(session, "will it rain today", "Will it rain today?"),
                builder.CardAction.imBack(session, "what is the met office", "What's the Met Office?"),
                builder.CardAction.imBack(session, "help", "Help me")
            ];

            //user has chatted previously - just standard hello with menu ui.
            msg.text(response).suggestedActions(builder.SuggestedActions.create(session,actions));

            session.send(msg);

            return next();
        },
        (session, results, next) => {
            return next({response: intent});
        },
        utils.storeAsPreviousIntent
    ]);
};