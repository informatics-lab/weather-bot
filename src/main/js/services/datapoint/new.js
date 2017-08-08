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
        if(sugar.Date.isBefore(dt, "now")) {
            return function () {
                return Promise.reject({response_id:"error.date.range.before"})
            }
        } else if (sugar.Date.hoursFromNow(dt) <= 40) {
            return getHourlyDataForLatLng;
        } else if(sugar.Date.daysFromNow(dt) > 7) {
            return function () {
                return Promise.reject({response_id:"error.date.range.after"})
            }
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

        // TODO: Currently downsream processing won't handle the format of a daily response.
        // getDailyDataForLatLng: getDailyDataForLatLng,

        // getHourlyDataForLatLng: getHourlyDataForLatLng,

        // get3HourlyDataForLatLng: get3HourlyDataForLatLng,

        getMethodForTargetTime: getMethodForTargetTime
    }

};