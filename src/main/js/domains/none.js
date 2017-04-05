"use strict";

var winston = require("winston");

module.exports = function (intents, persona) {

    var intent = "none";

    intents.onDefault([
        function (session, args, next) {
            winston.info("[ %s ] intent matched [ %s ]", intent, session.message.text);
            var response = persona.getResponse(intent);
            winston.debug("response [ %s ]", response);
            session.send(response);
        }
    ]);

};