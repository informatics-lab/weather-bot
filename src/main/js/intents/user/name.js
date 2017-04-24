"use strict";

var winston = require("winston");
var doT = require("dot");
var utils = require("../utils");

module.exports = function (bot, persona) {

    var intent = "user.name";

    bot.dialog(intent, [
        (session, results, next) => {
            winston.debug("[ %s ] intent matched [ %s ]", intent, session.message.text);
            if(results && results.entities) {
                var nameEntity = results.entities.filter(e => e.type === "name")[0];
                if (nameEntity) {
                    return next({response: nameEntity.entity});
                }
            }
            session.beginDialog("prompt", {key: "prompts.user.name", model: {}});
        },
        utils.sanitze.name,
        (session) => {
            var template = doT.template(persona.getResponse(intent));
            var response = template({name: session.userData.name});

            winston.debug("response [ %s ]", response);
            session.send(response);
            session.endDialog();
        }

    ])
};