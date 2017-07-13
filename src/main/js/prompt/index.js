"use strict";

var builder = require("botbuilder");
var winston = require("winston");

module.exports = function (bot, persona) {

    var dialog = "prompt";

    var sessionDataKey = null;

    bot.dialog(dialog, [
        (session, results, next) => {
            var key = results.key;
            var model = results.model;
            sessionDataKey = results.sessionDataKey;

            winston.debug("running prompt [%s]", key);
            var text = persona.getResponse(key, model);

            builder.Prompts.text(session, text);
        },
        (session, results, next) => {
            assign(session, sessionDataKey, results.response);
            return next();
        }
    ]);
};

//https://stackoverflow.com/questions/13719593/how-to-set-object-property-of-object-property-of-given-its-string-name-in-ja
function assign(obj, prop, value) {
    if (typeof prop === "string")
        prop = prop.split(".");

    if (prop.length > 1) {
        var e = prop.shift();
        assign(obj[e] =
                Object.prototype.toString.call(obj[e]) === "[object Object]"
                    ? obj[e]
                    : {},
            prop,
            value);
    } else
        obj[prop[0]] = value;
}