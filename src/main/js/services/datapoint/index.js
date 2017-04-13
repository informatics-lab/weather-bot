"use strict";

var sugar = require("sugar");
var winston = require("winston");
var regions = require("./../../../resources/datapoint/regions");
var haversine = require("haversine");
var httpClient = require("../httpClient");
var cache = require("js-cache");

var baseUri = "http://datapoint.metoffice.gov.uk/public/data";
var DAYS_5 = 432000000;

module.exports = (key) => {

    var datapointCache = new cache();
    datapointCache.on("del:locations", () => {
        datapointCache.set("locations", getAllLocations(), DAYS_5);
        winston.debug("datapoint locations cache updated");
    });

    function getAllLocations() {
        if (datapointCache.get("locations")) {
            winston.debug("resolving [ locations ] from datapoint cache");
            return Promise.resolve(datapointCache.get("locations"));
        } else {
            winston.debug("getting [ locations ] from datapoint");
            var locationsUri = "val/wxfcs/all/json/sitelist";
            var uri = `${baseUri}/${locationsUri}?key=${key}`;
            return httpClient.getAsJson(uri)
                .then((res) => {
                    datapointCache.set("locations", res, DAYS_5);
                    return res;
                });
        }
    }

    function getNearestSiteToLatLng(latlng) {
        return new Promise((resolve, reject) => {
            let nearest = {
                dist: Number.MAX_VALUE
            };
            getAllLocations()
                .then((locations)=> {
                    locations.Locations.Location.forEach((loc) => {
                        const dist = haversine(
                            {latitude: latlng.lat, longitude: latlng.lng},
                            {latitude: parseFloat(loc.latitude), longitude: parseFloat(loc.longitude)});
                        if (dist < nearest.dist) {
                            nearest = {
                                dist: dist,
                                location: loc,
                                region: regions[loc.region]
                            };
                        }
                    });
                    resolve(nearest);
                });
        });
    }

    function getDailyDataForSiteId(siteId) {
        var reqId = `daily.${siteId}`;
        if (datapointCache.get(reqId)) {
            winston.debug("resolving [ %s ] from datapoint cache", reqId);
            return Promise.resolve(datapointCache.get(reqId));
        } else {
            winston.debug("getting [ %s ] from datapoint", reqId);
            return getDataForSiteId(siteId, "daily")
                .then((res)=> {
                    var ttl = new sugar.Date().millisecondsUntil("midnight");
                    datapointCache.set(reqId, res, ttl.raw);
                    return res;
                });
        }
    }

    function get3HourlyDataForSiteId(siteId) {
        var reqId = `3hourly.${siteId}`;
        if (datapointCache.get(reqId)) {
            winston.debug("resolving [ %s ] from datapoint cache", reqId);
            return Promise.resolve(datapointCache.get(reqId));
        } else {
            winston.debug("getting [ %s ] from datapoint", reqId);
            return getDataForSiteId(siteId, "3hourly")
                .then((res)=> {
                    //TODO work out caching time for 3 hourly response
                    var ttl = new sugar.Date().millisecondsUntil("midnight");
                    datapointCache.set(reqId, res, ttl.raw);
                    return res;
                });
        }
    };

    function getDataForSiteId(siteId, resolution) {
        var uri = `${baseUri}/val/wxfcs/all/json/${siteId}?res=${resolution}&key=${key}`;
        return httpClient.getAsJson(uri);
    }

    function getTextForRegionId(regionId) {
        var uri = `${baseUri}/txt/wxfcs/regionalforecast/json/${regionId}?key=${key}`;
        return httpClient.getAsJson(uri);
    }

    return {
        getAllLocations: getAllLocations,

        getNearestSiteToLatLng: getNearestSiteToLatLng,

        getDailyDataForSiteId: getDailyDataForSiteId,

        get3HourlyDataForSiteId: get3HourlyDataForSiteId,

        getDataForSiteId: getDataForSiteId,

        getTextForRegionId: getTextForRegionId
    }

};