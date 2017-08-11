"use strict";

var winston = require("winston");
var utils = require("../utils");
var sugar = require("sugar");

module.exports = function (bot, persona) {

    var intent = "user.name";

    bot.dialog(intent, [
        (session, results, next) => {
            winston.debug("[ %s ] intent matched [ %s ]", intent, session.message.text);
            if (results && results.entities) {
                var nameEntity = results.entities.filter(e => e.type === "name")[0];
                if (nameEntity) {
                    session.userData.name = nameEntity.entity;
                    return next();
                }
            }
            session.beginDialog("prompt", {key: "prompts.user.name", sessionDataKey:"userData.name", model: {}});
        },
        utils.sanitze.name,
        (session) => {
            var model = {user: session.userData};
            var response = persona.getResponse(intent, model);
            winston.debug("response [ %s ]", response);
            session.send(response);
            session.endDialog();
        },
        utils.storeAsPreviousIntent
    ])
};