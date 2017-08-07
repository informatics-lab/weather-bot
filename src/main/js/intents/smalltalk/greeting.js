"use strict";

var winston = require("winston");
var utils = require("../utils");
var builder = require("botbuilder");

module.exports = function (bot, persona, logoStr) {

    var intent = "smalltalk.greeting";

    bot.dialog(intent, [
        (session, results, next) => {
            winston.debug("[ %s ] intent matched [ %s ]", intent, session.message.text);

            var model = {user: session.userData};

            var msg = new builder.Message(session);
            var response = persona.getResponse(intent, model);
            var actions = [
                builder.CardAction.imBack(session, "weather forecast", "weather"),
                builder.CardAction.imBack(session, "help", "help")
            ];
            if (!session.userData.greeted) {
                // this is the first time a user has spoken to us -
                // hero card greeting with a menu ui.
                msg.addAttachment(new builder.HeroCard(session)
                    .title("Sol Weather Bot")
                    .images([new builder.CardImage.create(session, logoStr)])
                    .text(`${response}. Welcome to my weather channel, you can ask me for any weather information you need.`)
                    .buttons(actions));
                session.userData.greeted = true;
            } else {
                //user has chatted previously - standard hello with menu ui.
                msg.text(response).suggestedActions(builder.SuggestedActions.create(session,actions));
            }
            session.send(msg);

            return next();
        },
        (session, results, next) => {
            return next({response: intent});
        },
        utils.storeAsPreviousIntent
    ]);
};