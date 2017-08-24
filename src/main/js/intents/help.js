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

            var model = {user: session.userData};

            var response = persona.getResponse(intent, model);

            session.send(response);
            return next();
        },
        (session, results, next) => {
            return next({response: intent});
        },
        utils.storeAsPreviousIntent
    ]);
};
