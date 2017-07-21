"use strict";

var sugar = require("sugar");
var winston = require("winston");
var httpClient = require("../httpClient");
var cache = require("js-cache");
var constants = require("../../constants");

var baseUri = "https://pwms.datapoint.metoffice.gov.uk";

module.exports = function(key) {

    var datapointCache = new cache();

    function getMethodForTargetTime(dt) {
        if (sugar.Date.hoursFromNow(dt) <= 40) {
            return getHourlyDataForLatLng;
        }
        return get3HourlyDataForLatLng;
    }

    function get3HourlyDataForLatLng(lat, lng) {
        return getAndCacheDataForLatLng(constants.THREE_HOURLY, lat, lng);
    }

    function getDailyDataForLatLng(lat, lng) {
        return getAndCacheDataForLatLng(constants.DAILY, lat, lng);
    }

    function getHourlyDataForLatLng(lat, lng) {
        return getAndCacheDataForLatLng(constants.HOURLY, lat, lng);
    }

    function getAndCacheDataForLatLng(resolution, lat, lng) {
        var slug = `${resolution}-${lat}-${lng}`;
        if (datapointCache.get(slug)) {
            winston.debug("resolving [ %s ] from datapoint cache", slug);
            return Promise.resolve(datapointCache.get(slug));
        } else {
            winston.debug("getting [ %s ] from datapoint", slug);
            return getDataForLatLng(lat, lng, resolution)
                .then((res) => {
                    res.resolution = resolution;
                    var ttl = 1000 * 60 * 30; // 30 minutes. TODO: Different cache lengths?
                    datapointCache.set(slug, res, ttl.raw);

                    return res;
                });
        }
    }

    function getDataForLatLng(lat, lng, resolution) {
        var uri = `${baseUri}/points/v1/pwms-${resolution}-spot-forecast?latitude=${lat}&longitude=${lng}`;
        var headers = {
            "api-key": key
        };
        return httpClient.getAsJson(uri, headers);
    }

    return {

        getDailyDataForLatLng: getDailyDataForLatLng,

        //getHourlyDataForLatLng: getHourlyDataForLatLng, // TODO: Currently downsream processing won't handle the differnet format of daily.

        getDataForLatLng: getDataForLatLng,

        get3HourlyDataForLatLng: get3HourlyDataForLatLng,

        getMethodForTargetTime: getMethodForTargetTime
    }

};