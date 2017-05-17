"use strict";

var builder = require("botbuilder");
var winston = require("winston");
var ua = require('universal-analytics');

module.exports = function (bot, persona) {

    var intent = "help";

    bot.dialog(intent, [
        function (session) {
            winston.debug("[ %s ] intent matched [ %s ]", intent, session.message.text);
            var response = persona.getResponse(intent);
            winston.debug("response [ %s ]", response);
            ua(session.userData.ga_id, session.userData.uuid)
                .event({ec: "intent", ea: intent, el: session.message.text})
                .send();
            session.send(response);
            session.endDialog();
        }]
    );

};
