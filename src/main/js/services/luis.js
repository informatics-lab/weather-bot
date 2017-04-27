"use strict";

var httpClient = require("./httpClient");
var cache = require("js-cache");
var sugar = require("sugar");
var winston = require("winston");
var constants = require("../constants");

module.exports = (appId, subscriptionKey) => {

    var luisCache = new cache();

    function parse(q) {
        var slug = sugar.String.dasherize(q.toLowerCase());
        if(luisCache.get(slug)) {
            winston.debug("resolving [ %s ] from luis cache", slug);
            return Promise.resolve(luisCache.get(slug));
        } else {
            winston.debug("getting [ %s ] from luis", slug);
            var uri = `https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/${appId}?subscription-key=${subscriptionKey}&verbose=true&timezoneOffset=0.0&spellCheck=true&q=${q}`;
            return httpClient.getAsJson(uri)
                .then((res) => {
                    luisCache.set(slug, res, constants.DAYS_TO_MILLIS(1));
                    return res;
                });
        }
    }

    return {
        parse: parse
    }
};