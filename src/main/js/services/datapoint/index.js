"use strict";

var sugar = require("sugar");
var winston = require("winston");
var regions = require("./../../../resources/datapoint/regions");
var haversine = require("haversine");
var httpClient = require("../httpClient");
var cache = require("js-cache");
var constants = require("../../constants");

var baseUri = "http://datapoint.metoffice.gov.uk/public/data";
var DAYS_5 = constants.DAYS_TO_MILLIS(5);

module.exports = (key) => {

    var datapointCache = new cache();
    datapointCache.on("del:locations", () => {
        datapointCache.set("locations", getAllLocations(), DAYS_5);
        winston.debug("datapoint locations cache updated");
    });

    function getAllLocations() {
        var slug = "locations";
        if (datapointCache.get("locations")) {
            winston.debug("resolving [ %s ] from datapoint cache", slug);
            return Promise.resolve(datapointCache.get(slug));
        } else {
            winston.debug("getting [ %s ] from datapoint", slug);
            var locationsUri = "val/wxfcs/all/json/sitelist";
            var uri = `${baseUri}/${locationsUri}?key=${key}`;
            return httpClient.getAsJson(uri)
                .then((res) => {
                    datapointCache.set(slug, res, DAYS_5);
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
        var slug = `${constants.DAILY}-${siteId}`;
        if (datapointCache.get(slug)) {
            winston.debug("resolving [ %s ] from datapoint cache", slug);
            return Promise.resolve(datapointCache.get(slug));
        } else {
            winston.debug("getting [ %s ] from datapoint", slug);
            return getDataForSiteId(siteId, constants.DAILY)
                .then((res)=> {
                    var ttl = new sugar.Date().millisecondsUntil("midnight");
                    datapointCache.set(slug, res, ttl.raw);
                    res.resolution = constants.DAILY;
                    return res;
                });
        }
    }

    function get3HourlyDataForSiteId(siteId) {
        var slug = `${constants.THREE_HOURLY}-${siteId}`;
        if (datapointCache.get(slug)) {
            winston.debug("resolving [ %s ] from datapoint cache", slug);
            return Promise.resolve(datapointCache.get(slug));
        } else {
            winston.debug("getting [ %s ] from datapoint", slug);
            return getDataForSiteId(siteId, constants.THREE_HOURLY)
                .then((res)=> {

                    // reformat the response data from datapoint
                    var wx = new Array();
                    var nowDT = sugar.Date.create("now");
                    var compareDT = sugar.Date.addHours(sugar.Date.create(nowDT.toISOString(), {fromUTC:true}), -3);
                    res.SiteRep.DV.Location.Period.forEach((day) => {
                        var date = sugar.Date.create(day.value, {setUTC: true});
                        day.Rep.forEach((fcst) => {
                            var fcstDate = sugar.Date.addMinutes(sugar.Date.create(date.toISOString(),{fromUTC:true}), fcst.$);
                            if(sugar.Date.isAfter(fcstDate, compareDT)) {
                                fcst.date = fcstDate.toISOString();
                                wx.push(fcst);
                            }
                        });
                    });
                    res.SiteRep.DV.Location.Period = wx;

                    var ttl = sugar.Date.millisecondsUntil(nowDT, sugar.Date.create(res.SiteRep.DV.Location.Period[1].date, {fromUTC:true}));
                    datapointCache.set(slug, res, ttl);
                    res.resolution = constants.THREE_HOURLY;
                    return res;
                });
        }
    }

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