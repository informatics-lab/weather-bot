"use strict";

var winston = require("winston");
var httpClient = require("./httpClient");
var cache = require("js-cache");

var baseUri = "https://maps.googleapis.com/maps/api/geocode/json";
var DAYS_5 = 432000000; //5 days in milliseconds

module.exports = (key) => {

    var gmapsCache = new cache();

    function geocode(location) {
        if (gmapsCache.get(location)) {
            winston.debug("resolving [ %s ] from gmaps cache", location);
            return Promise.resolve(gmapsCache.get(location));
        } else {
            winston.debug("getting [ %s ] from gmaps", location);
            var uri = `${baseUri}?address=${location}&region=uk&language=en&key=${key}`;
            return httpClient.getAsJson(uri)
                .then((res) => {
                    gmapsCache.set(location, res, DAYS_5);
                    return res;
                });
        }
    }

    return {
        geocode: geocode
    }
};