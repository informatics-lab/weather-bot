"use strict";

var winston = require("winston");

module.exports = function (persona) {

    function randomIntFromInterval(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    function getRandomResponseForKey(key) {
        if(persona.hasOwnProperty(key)) {
            return persona[key][randomIntFromInterval(0, persona[key].length - 1)];
        } else {
            return persona.none[randomIntFromInterval(0, persona[none].length - 1)]
        }
    }

    return {
        getResponse: function (key) {
            return getRandomResponseForKey(key);
        }
    }
};