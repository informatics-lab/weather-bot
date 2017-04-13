"use strict";

var winston = require("winston");
var builder = require("botbuilder");

module.exports = function (persona) {

    function randomIntFromInterval(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    function getRandomElementFromArray(array) {
        return array[randomIntFromInterval(0, array.length - 1)];
    }

    function buildMediaResponse(obj) {
        var mediaMsg = new builder.Message().attachments([{
            contentType: obj.contentType,
            name: obj.name,
            contentUrl: obj.contentUrl
        }]);
        return mediaMsg;
    }

    function getResponseForKey(key) {
        var keyParts = key.split(".");
        var personaProperty = persona;
        for (var i = 0; i < keyParts.length; i++) {
            if (personaProperty.hasOwnProperty(keyParts[i])) {
                personaProperty = personaProperty[keyParts[i]];
            }
            else {
                winston.warn("persona is missing key [%s]", key);
                return getResponseForKey("none");
            }
        }
        if (typeof(personaProperty === "object")) {
            if(personaProperty.type) {
                return buildMediaResponse(personaProperty);
            } else {
                return getRandomElementFromArray(personaProperty);
            }
        } else if (typeof(personaProperty === "string")) {
            return personaProperty;
        } else {
            winston.error("persona [%s] value was not 'object' or 'string' but was [%s]", key, typeof(persona[key]));
            return getResponseForKey("none");
        }
    }

    return {
        getResponse: function (key) {
            return getResponseForKey(key);
        }
    }
};