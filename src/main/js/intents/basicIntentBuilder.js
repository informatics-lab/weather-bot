"use strict";

var winston = require("winston");
var ua = require("universal-analytics");
var utils = require("./utils");


/**
 * Module for building basic intents.
 *
 * Baisc intents are essentially intents that LUIS will recognise that map directly to resources in the persona.
 * These intents require no further processing. Much of the 'smalltalk' functionality is provided in this way.
 *
 * @param intent - unique intent identifier
 */
module.exports = function (intent) {
    return function (bot, persona) {
        bot.dialog(intent, [
            (session, results, next) => {
                winston.debug("[ %s ] intent matched [ %s ]", intent, session.message.text);
                var model = {user: session.userData};
                var response = persona.getResponse(intent, model, session);
                var visitor = ua(session.userData.ga_id, session.userData.uuid);
                visitor.event({ec: "intent", ea: intent, el: session.message.text}).send();
                session.send(response);
                return next({response: intent});
            },
            utils.storeAsPreviousIntent
        ]);
    };
};
