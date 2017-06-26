"use strict";

var winston = require("winston");
var builder = require("botbuilder");
var doT = require("dot");

module.exports = function (persona) {

    function randomIntFromInterval(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    function applyModelToTemplate(template, model) {
        var settings = doT.templateSettings;
        settings.strip = false;
        var dotTemp = doT.template(template, settings);
        var text = dotTemp(model);
        return text;
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

    function createHeroCard(session, obj, model) {

        var text = applyModelToTemplate(getRandomElementFromArray(obj.text), model);

        return new builder.HeroCard(session)
            .title(obj.title)
            .text(text)
            .images([
                builder.CardImage.create(session, obj.contentUrl)
            ])
            .buttons([
                builder.CardAction.openUrl(session, obj.linkUrl, obj.linkText)
            ]);
    }

    function createVideoCard(session, obj, model) {

        var text = applyModelToTemplate(getRandomElementFromArray(obj.text), model);

        return new builder.VideoCard(session)
            .title(obj.title)
            .text(text)
            .media([
                {url: obj.contentUrl}
            ])
            .buttons([
                builder.CardAction.openUrl(session, obj.linkUrl, obj.linkText)
            ]);
    }

    function buildMediaResponse(session, obj, model) {
        var card;
        switch (obj.type) {
            case "video":
                card = createVideoCard(session, obj, model);
                break;
            case "image":
                card = createHeroCard(session, obj, model);
                break;
        }
        return new builder.Message(session).addAttachment(card);
    }

    /**
     * Gets a suitable (keyed) response from the provided persona.
     *
     * @param key - unique key of response item in persona response file.
     * @param model - data model to apply to response
     * @param session - current conversation session
     */
    function getResponseForKey(key, model, session) {
        return getResponseForKeyWithScore(key, null, model, session);
    }

    /**
     * Gets a suitable (keyed) response from the provided persona.
     * Allows for certainty score to be passed in to select from variable certainty responses.
     *
     * @param key - unique key of response item in persona response file.
     * @param score - float between 0 and 1
     * @param model - data model to apply to response
     * @param session - current conversation session
     */
    function getResponseForKeyWithScore(key, score, model, session) {
        var personaProperty = getPersonaPropertyForKey(key);

        var responseItem;
        if (personaProperty && Array.isArray(personaProperty)) {
            responseItem = getRandomElementFromArray(personaProperty);
        } else {
            responseItem = personaProperty;
        }


        if (responseItem && typeof(responseItem) === "object" && responseItem.type && responseItem.type === "variable_certainty") {
            responseItem = getVariableCertaintyResponse(responseItem.certainties, score);
        }


        var result;
        if (responseItem && typeof(responseItem) === "object" && responseItem.type && (responseItem.type === "video" || responseItem.type === "image")) {
            result = buildMediaResponse(session, responseItem, model);
        } else if (responseItem && typeof(responseItem) === "string") {
            result = applyModelToTemplate(responseItem, model);
        } else {
            winston.error("response item for key [%s] was not 'object' or 'string' but was [%s]", key, typeof(responseItem));
            result = getResponseForKey("error.general");
        }
        return result;
    }

    return {
        getResponse: getResponseForKey,
        getResponseForScore: getResponseForKeyWithScore
    }
};