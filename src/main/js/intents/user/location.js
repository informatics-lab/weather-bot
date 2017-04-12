"use strict";

var winston = require("winston");
var doT = require("dot");

module.exports = function (bot, persona, gmaps) {

    var intent = "user.location";

    bot.dialog(intent, [
        (session, results, next) => {
            winston.debug("[ %s ] intent matched [ %s ]", intent, session.message.text);
            if(results && results.entities) {
                var locationEntity = results.entities.filter(e => e.type === "location")[0];
                if (locationEntity) {
                    return next({response: locationEntity.entity});
                }
            }
            session.beginDialog("prompt", {key: "prompts.user.location", model: {pre: "To"}});
        },
        (session, results, next) => {
            session.userData.location = results.response;
            gmaps.geocode(session.userData.location)
                .then((res)=> {
                    session.userData.gmaps = res;
                    return next();
                });
        },
        (session) => {
            var template = doT.template(persona.getResponse(intent));
            var response = template({location: session.userData.location});

            winston.debug("response [ %s ]", response);
            session.send(response);
            session.endDialog();
        }
    ])
};