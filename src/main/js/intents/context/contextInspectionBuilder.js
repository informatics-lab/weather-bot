"use strict";

var winston = require("winston");
var ua = require("universal-analytics");
var utils = require("../utils");

/**
 * Module for inspecting the current context values.
 *
 * Provides a means for the user to recall the current values in the conversation context (session.conversationData)
 *
 * @param intent - unique intent identifier
 * @param sessionConversationDataKey - identifier for context user is recalling.
 */
module.exports = function (intent, conversationDataKey) {

    return function (bot, persona) {
        bot.dialog(intent, [
            (session, results, next) => {
                winston.debug("[ %s ] intent matched [ %s ]", intent, session.message.text);

                var visitor = ua(session.userData.ga_id, session.userData.uuid);
                visitor.event({ec: "intent", ea: intent, el: session.message.text}).send();

                var value = utils.convData.get(session, conversationDataKey);
                if(value) {
                    session.send(value);
                } else {
                    session.send(persona.getResponse("error.nonsense"));
                }

                return next({response: intent});
            },
            utils.storeAsPreviousIntent
        ]);
    };
};
