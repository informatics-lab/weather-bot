"use strict";

var winston = require("winston");
var ua = require('universal-analytics');
var utils = require("./utils");
var builder = require("botbuilder");

module.exports = function (bot, persona) {

    var intent = "help";

    bot.dialog(intent, [
        (session, results, next) => {
            winston.debug("[ %s ] intent matched [ %s ]", intent, session.message.text);

            ua(session.userData.ga_id, session.userData.uuid)
                .event({ec: "intent", ea: intent, el: session.message.text})
                .send();

            var msg = new builder.Message(session);
            var response = persona.getResponse(intent);
            var actions = [
                builder.CardAction.imBack(session, "weather forecast", "get a forecast"),
                builder.CardAction.imBack(session, "will it rain today", "will it rain tomorrow"),
                builder.CardAction.imBack(session, "do i need a coat today", "will I need a coat today"),
                builder.CardAction.imBack(session, "is it a good day for a run", "is it a good day for a run")
            ];

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
