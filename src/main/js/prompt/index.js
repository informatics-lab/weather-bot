"use strict";

var builder = require("botbuilder");
var winston = require("winston");
var convData = require('../intents/utils').convData;

module.exports = function(bot, persona) {

    var dialog = "prompt";

    bot.dialog(dialog, [
        (session, results, next) => {
            var key = results.key;
            var model = results.model;
            session.dialogData.promptTarget = {
                sessionDataKey: results.sessionDataKey, // Depricated in favour of 'key' and the convData tools.
                key: results.convDataKey,
                ttl: results.ttl
            };
            winston.debug("running prompt [%s]", key);
            var text = persona.getResponse(key, model);

            builder.Prompts.text(session, text);
        },
        (session, results, next) => {
            var target = session.dialogData.promptTarget;
            if (target.sessionDataKey) {
                assign(session, target.sessionDataKey, results.response);
            }
            if (target.key) {
                convData.addWithExpiry(session, target.key, results.response, target.ttl);
            }
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
            Object.prototype.toString.call(obj[e]) === "[object Object]" ?
            obj[e] : {},
            prop,
            value);
    } else
        obj[prop[0]] = value;
}