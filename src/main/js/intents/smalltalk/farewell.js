"use strict";

var winston = require("winston");
var utils = require("../utils");

module.exports = function (bot, persona) {

    var intent = "smalltalk.farewell";

    bot.dialog(intent, [
        (session, results, next) => {
            winston.debug("[ %s ] intent matched [ %s ]", intent, session.message.text);

            var model = {user: session.userData};
            var response = persona.getResponse(intent, model);
            winston.debug("response [ %s ]", response);
            
            session.send(response);
            return next();
        },
        (session, results, next) => {
            return next({response: intent});
        },
        utils.storeAsPreviousIntent
    ])
};