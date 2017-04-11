"use strict";

var regions = require("./regions");
var haversine = require("haversine");
var httpClient = require("../httpClient");
var cache = require("js-cache");

var baseUri = "http://datapoint.metoffice.gov.uk/public/data";
var DAYS_5 = 432000000;

module.exports = (key) => {

    var datapointCache = new cache();
    datapointCache.set("locations", this.getAllLocations(), DAYS_5);
    datapointCache.on("del:locations", () => {
        datapointCache.set("locations", this.getAllLocations(), DAYS_5);
    });

    return {
        getAllLocations: () => {
            var locationsUri = "val/wxfcs/all/json/sitelist";
            var uri = `${baseUri}/${locationsUri}?key=${key}`;
            return httpClient.getAsJson(uri);
        },

        getNearestSiteToLatLng: (latlng) => {
            return new Promise((resolve, reject) => {
                let nearest = {
                    dist: Number.MAX_VALUE
                };
                var locations = datapointCache.get("locations");
                locations.forecastSites.forEach((loc) => {
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
        },

        getDataForSiteId: (siteId) => {
            var uri = `${baseUri}/val/wxfcs/all/json/${siteId}?res=3hourly&key=${key}`;
            return httpClient.getAsJson(uri);
        },

        getTextForRegionId(regionId) {
            var uri = `${baseUri}/txt/wxfcs/regionalforecast/json/${regionId}?key=${key}`;
            return httpClient.getAsJson(uri);
        }
    }

};