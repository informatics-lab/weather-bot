"use strict";

var httpClient = require("./httpClient");
var cache = require("js-cache");

var baseUri = "https://maps.googleapis.com/maps/api/geocode/json";
var DAYS_5 = 432000000;

exports.module = (key) => {

    var gmapsCache = new cache();

    return {
        geocode: (location) => {
            if (gmapsCache.get(location)) {
                return Promise.resolve(gmapsCache.get(location));
            } else {
                var uri = `${baseUri}?address=${location}&region=uk&language=en&key=${key}`;
                return httpClient.getAsJson(uri)
                    .then((res) => {
                        gmapsCache.set(location, res, DAYS_5);
                        return res;
                    });
            }
        }
    }
};