"use strict";

var sugar = require("sugar");
var winston = require("winston");
var regions = require("./../../../resources/datapoint/regions");
var haversine = require("haversine");
var httpClient = require("../httpClient");
var cache = require("js-cache");
var constants = require("../../constants");

var baseUri = "https://pwms.datapoint.metoffice.gov.uk";
var DAYS_5 = constants.DAYS_TO_MILLIS(5);

module.exports = function(key) {

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

    // function get3HourlyDataForSiteId(siteId) {
    //     var slug = `${constants.THREE_HOURLY}-${siteId}`;
    //     if (datapointCache.get(slug)) {
    //         winston.debug("resolving [ %s ] from datapoint cache", slug);
    //         return Promise.resolve(datapointCache.get(slug));
    //     } else {
    //         winston.debug("getting [ %s ] from datapoint", slug);
    //         return getDataForSiteId(siteId, constants.THREE_HOURLY)
    //             .then((res)=> {
    //
    //                 // reformat the response data from datapoint
    //                 var wx = new Array();
    //                 var nowDT = sugar.Date.create("now");
    //                 var compareDT = sugar.Date.addHours(sugar.Date.create(nowDT.toISOString(), {fromUTC:true}), -3);
    //                 res.SiteRep.DV.Location.Period.forEach((day) => {
    //                     var date = sugar.Date.create(day.value, {setUTC: true});
    //                     day.Rep.forEach((fcst) => {
    //                         var fcstDate = sugar.Date.addMinutes(sugar.Date.create(date.toISOString(),{fromUTC:true}), fcst.$);
    //                         if(sugar.Date.isAfter(fcstDate, compareDT)) {
    //                             fcst.date = fcstDate.toISOString();
    //                             wx.push(fcst);
    //                         }
    //                     });
    //                 });
    //                 res.SiteRep.DV.Location.Period = wx;
    //                 res.resolution = constants.THREE_HOURLY;
    //
    //                 var ttl = sugar.Date.millisecondsUntil(nowDT, sugar.Date.create(res.SiteRep.DV.Location.Period[1].date, {fromUTC:true}));
    //                 datapointCache.set(slug, res, ttl);
    //
    //                 return res;
    //             });
    //     }
    // }

    function getDataForLatLng(lat, lng, resolution) {
        var uri = `${baseUri}/point/v1/pwms-${resolution}-spot-forecast?latitude=${lat}&longitude=${lng}`;
        var headers = {
          "api-key": key
        };
        return httpClient.getAsJson(uri, headers);
    }

    return {

        getDailyDataForLatLng: getDailyDataForLatLng,

        getDataForLatLng: getDataForLatLng,
    }

};
