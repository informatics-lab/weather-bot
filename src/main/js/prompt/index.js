"use strict";

var builder = require("botbuilder");
var winston = require("winston");

module.exports = function (bot, persona) {

    var dialog = "prompt";

    bot.dialog(dialog, [
        (session, results) => {
            var key = results.key;
            var model = results.model;

            winston.debug("running prompt [%s]", key);
            var text = persona.getResponse(key, model);

            builder.Prompts.text(session, text);
        }
    ]);
};