"use strict";

var httpClient = require("./httpClient");

module.exports = (appId, subscriptionKey) => {
    return {
        parse: (q) => {
            var uri = `https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/${appId}?subscription-key=${subscriptionKey}&verbose=true&timezoneOffset=0.0&spellCheck=true&q=${q}`;
            return httpClient.getAsJson(uri);
        }
    }
};