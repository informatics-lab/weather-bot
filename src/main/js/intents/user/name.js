"use strict";

var winston = require("winston");
var doT = require("dot");

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
        (session, results, next) => {

            /* name regex
             * matches:
             * my name is {name}
             * call me {name}
             * it's {name}
             */
            
            var nameRegex = /(?:( me| is|it's)) (\w+)/g;
            var regexResult = nameRegex.exec(results.response);
            if(regexResult && regexResult.length === 3) {
                session.userData.name = regexResult[2];
            } else {
                session.userData.name = results.response;
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