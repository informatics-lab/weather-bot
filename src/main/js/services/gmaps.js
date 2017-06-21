"use strict";

var winston = require("winston");
var httpClient = require("./httpClient");
var cache = require("js-cache");
var sugar = require("sugar");
var constants = require("../constants");

module.exports = (key) => {

    var gmapsCache = new cache();

    function locationInUK(result) {
        return new Promise((resolve, reject) => {
            result.results[0].address_components.forEach((ac) => {
                if (ac.long_name === "United Kingdom") {
                    resolve(result);
                }
            });
            reject(`[ ${result.results[0].formatted_address} ] was located but is outside of the UK`);
        });
    }

    function geocode(location) {

        var slug = sugar.String.underscore(location.toLowerCase());
        if (gmapsCache.get(slug)) {
            winston.debug("resolving [ %s ] from gmaps cache", slug);
            return Promise.resolve(gmapsCache.get(slug));
        } else {
            winston.debug("getting [ %s ] from gmaps", slug);
            var uri = `https://maps.googleapis.com/maps/api/geocode/json?address=${location}&region=uk&language=en&key=${key}`;
            return httpClient.getAsJson(uri)
                .then((res) => {
                    return locationInUK(res);
                })
                .then((res) => {
                    gmapsCache.set(slug, res, constants.DAYS_TO_MILLIS(5));
                    return res;
                });
        }
    }

    return {
        geocode: geocode
    }
};