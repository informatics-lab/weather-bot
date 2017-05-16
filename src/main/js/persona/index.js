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
            return getResponseForKey("error.general");
        }
        return getRandomElementFromArray(match.response);
    }

    function createHeroCard(session, obj) {
        return new builder.HeroCard(session)
            .title(obj.title)
            .text(getRandomElementFromArray(obj.text))
            .images([
                builder.CardImage.create(session, obj.contentUrl)
            ])
            .buttons([
                builder.CardAction.openUrl(session, obj.linkUrl, obj.linkText)
            ]);
    }
    
    function createVideoCard(session, obj) {
        return new builder.VideoCard(session)
            .title(obj.title)
            .text(getRandomElementFromArray(obj.text))
            .media([
                { url: obj.contentUrl }
            ])
            .buttons([
                builder.CardAction.openUrl(session, obj.linkUrl, obj.linkText)
            ]);
    }

    function buildMediaResponse(session, obj) {
        var card;
        switch (obj.type) {
            case "video":
                card = createVideoCard(session, obj);
                break;
            case "image":
                card = createHeroCard(session, obj);
                break;
        }
        var response = new builder.Message(session).addAttachment(card);
        return response;
    }

    function getResponseForKey(key, session) {
        return getResponseForKeyWithScore(key, null, session);
    }

    function getResponseForKeyWithScore(key, score, session) {
        var personaProperty = getPersonaPropertyForKey(key);

        var responseItem;
        if(personaProperty && Array.isArray(personaProperty)) {
            responseItem = getRandomElementFromArray(personaProperty);
        } else {
            responseItem = personaProperty;
        }

        if (responseItem && typeof(responseItem) === "object") {
            if (responseItem.type && (responseItem.type === "video" || responseItem.type === "image")) {
                return buildMediaResponse(session, responseItem);
            } else if (responseItem.type && responseItem.type === "variable_certainty") {
                return getVariableCertaintyResponse(responseItem.certainties, score);
            } else {
                winston.error("response item [%s] value was 'object' but was type [%s]", key, responseItem.type);
                return getResponseForKey("error.general");
            }
        } else if (responseItem && typeof(responseItem) === "string") {
            return responseItem;
        } else {
            winston.error("response item [%s] value was not 'object' or 'string' but was [%s]", key, typeof(responseItem));
            return getResponseForKey("error.general");
        }
    }

    return {
        getResponse: getResponseForKey,
        getResponseForScore: getResponseForKeyWithScore
    }
};