"use strict";

var builder = require("botbuilder");
var winston = require("winston");

module.exports = function (intents, persona) {

    var intent = "help";

    intents.matches(intent, [
        function (session) {
            winston.debug("[ %s ] intent matched [ %s ]", intent, session.message.text);
            var response = persona.getResponse(intent);
            
            winston.debug("response [ %s ]", response);
            session.send(response);
            session.endDialog();
        }]
    );

};