"use strict";

var winston = require("winston");

module.exports = function (persona) {

    function randomIntFromInterval(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    function getRandomResponseForKey(key) {
        return persona[key][randomIntFromInterval(0, persona[key].length - 1)];
    }

    function getResponseForKey(key) {
        if (persona.hasOwnProperty(key)) {
            if (typeof(persona[key] === "object")) {
                return getRandomResponseForKey(key);
            } else if (typeof(persona === "string")) {
                return persona[key];
            } else {
                winston.error("persona [%s] value was not 'object' or 'string' but was [%s]", key, typeof(persona[key]));
                return getResponseForKey("none");
            }
        } else {
            winston.warn("persona is missing key [%s]", key);
            return getResponseForKey("none");
        }
    }

    return {
        getResponse: function (key) {
            return getResponseForKey(key);
        }
    }
};