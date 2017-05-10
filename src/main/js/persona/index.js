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

    function getPersonaPropertyForKey(key) {
        var keyParts = key.split(".");
        var personaProperty = persona;
        for (var i = 0; i < keyParts.length; i++) {
            if (personaProperty.hasOwnProperty(keyParts[i])) {
                personaProperty = personaProperty[keyParts[i]];
            }
            else {
                winston.warn("persona is missing key [%s]", key);
                personaProperty = null;
            }
        }
        return personaProperty;
    }

    function getVariableCertaintyResponse(certainties, score) {
        var match = certainties.filter((cert) => {
            return (score >= cert.score_lower_bound && score <= cert.score_upper_bound);
        });
        if (match && match.length === 1) {
            match = match[0];
        } else {
            winston.error("score [ %s ] did not match well with certainties [ %s ]", score, certainties);
            return getResponseForKey("error");
        }
        return getRandomElementFromArray(match.response);
    }

    function buildMediaResponse(obj) {
        var attachment;
        switch (obj.type) {
            case "video":
                attachment = new builder.VideoCard()
                    .title(obj.title)
                    .text(getRandomElementFromArray(obj.text))
                    .media([new builder.CardMedia.create(null, obj.contentUrl)])
                    .autoloop(false)
                    .autostart(false)
                    .shareable(true);
                break;
            case "image":
                attachment = new builder.HeroCard()
                    .title(obj.title)
                    .text(getRandomElementFromArray(obj.text))
                    .images([new builder.CardImage.create(null, obj.contentUrl)]);
                break;
        }
        var mediaMsg = new builder.Message().attachments([attachment]);
        return mediaMsg;
    }

    function getResponseForKey(key) {
        return getResponseForKeyWithScore(key, null);
    }

    function getResponseForKeyWithScore(key, score) {
        var personaProperty = getPersonaPropertyForKey(key);

        if (personaProperty && typeof(personaProperty === "object")) {
            if (personaProperty.type && (personaProperty.type === "video" || personaProperty.type === "image")) {
                return buildMediaResponse(personaProperty);
            } else if (personaProperty.type && personaProperty.type === "variable_certainty") {
                return getVariableCertaintyResponse(personaProperty.certainties, score);
            } else {
                return getRandomElementFromArray(personaProperty);
            }
        } else if (personaProperty && typeof(personaProperty === "string")) {
            return personaProperty;
        } else {
            winston.error("persona [%s] value was not 'object' or 'string' but was [%s]", key, typeof(personaProperty));
            return getResponseForKey("error");
        }
    }

    return {
        getResponse: getResponseForKey,
        getResponseForScore: getResponseForKeyWithScore
    }
};