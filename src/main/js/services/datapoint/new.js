"use strict";

var sugar = require("sugar");
var winston = require("winston");
var httpClient = require("../httpClient");
var cache = require("js-cache");
var constants = require("../../constants");

var baseUri = "https://pwms.datapoint.metoffice.gov.uk";

module.exports = function (key) {

    var datapointCache = new cache();

    function getDailyDataForLatLng(lat, lng) {
        var slug = `${constants.DAILY}-${lat}-${lng}`;
        if (datapointCache.get(slug)) {
            winston.debug("resolving [ %s ] from datapoint cache", slug);
            return Promise.resolve(datapointCache.get(slug));
        } else {
            winston.debug("getting [ %s ] from datapoint", slug);
            return getDataForLatLng(lat, lng, constants.DAILY)
                .then((res)=> {
                    res.resolution = constants.DAILY;

                    var ttl = new sugar.Date().millisecondsUntil("midnight");
                    datapointCache.set(slug, res, ttl.raw);

                    return res;
                });
        }
    }

    function getHourlyDataForLatLng(lat, lng) {
        var slug = `${constants.HOURLY}-${lat}-${lng}`;
        if (datapointCache.get(slug)) {
            winston.debug("resolving [ %s ] from datapoint cache", slug);
            return Promise.resolve(datapointCache.get(slug));
        } else {
            winston.debug("getting [ %s ] from datapoint", slug);
            return getDataForLatLng(lat, lng, constants.HOURLY)
                .then((res)=> {
                    res.resolution = constants.HOURLY;

                    //TODO alter caching to be end of this hour
                    var ttl = new sugar.Date().millisecondsUntil("midnight");
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

        getHourlyDataForLatLng: getHourlyDataForLatLng,

        getDataForLatLng: getDataForLatLng,
    }

};
