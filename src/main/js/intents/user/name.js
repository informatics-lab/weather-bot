"use strict";

var winston = require("winston");
var doT = require("dot");
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
                    return next({response: nameEntity.entity});
                }
            }
            session.beginDialog("prompt", {key: "prompts.user.name", model: {}});
        },
        utils.sanitze.name,
        (session, results, next) => {
            if (!session.userData.name || !(session.userData.name === results.response)) {
                session.userData.name = sugar.String.capitalize(results.response, true, true);
            }
            return next();
        },
        (session) => {
            var template = doT.template(persona.getResponse(intent));
            var response = template({name: session.userData.name});

            winston.debug("response [ %s ]", response);
            session.send(response);
            session.endDialog();
        }

    ])
};