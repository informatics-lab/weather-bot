"use strict";

var builder = require("botbuilder");
var winston = require("winston");
var doT = require("dot");

module.exports = function (bot, persona) {

    var dialog = "prompt";

    bot.dialog(dialog, [
        (session, results) => {
            var key = results.key;
            var model = results.model;

            winston.debug("running prompt [%s]", key);

            var template = doT.template(persona.getResponse(key));
            var prompt = template(model);

            builder.Prompts.text(session, prompt);
        }
    ]);
};