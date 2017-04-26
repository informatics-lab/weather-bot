"use strict";

var httpClient = require("./httpClient");
var cache = require("js-cache");
var sugar = require("sugar");
var winston = require("winston");

var DAY_1 = 86400000; //1 day in milliseconds

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
                    luisCache.set(slug, res, DAY_1);
                    return res;
                });
        }
    }

    return {
        parse: parse
    }
};