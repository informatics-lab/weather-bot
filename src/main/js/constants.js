"use strict";

var wxTypes = require("../resources/datapoint/weatherTypes");
var visibilities = require("../resources/datapoint/visibilities");
var uvs = require("../resources/datapoint/uvIndexes");
var sugar = require("sugar");

var daysToMillis = function (n) {
    return n * 86400000;
};

var hoursToMillis = function (n) {
    return n * 3600000;
};

var dayIndexToDayString = function(i) {
    switch(i) {
        case 0 : return "Sunday";
        case 1 : return "Monday";
        case 2 : return "Tuesday";
        case 3 : return "Wednesday";
        case 4 : return "Thursday";
        case 5 : return "Friday";
        case 6 : return "Saturday";
        default : return null;
    }
};

var monthIndexToMonthString = function(i)  {
    switch(i) {
        case 0 : return "January";
        case 1 : return "February";
        case 2 : return "March";
        case 3 : return "April";
        case 4 : return "May";
        case 5 : return "June";
        case 6 : return "July";
        case 7 : return "August";
        case 8 : return "September";
        case 9 : return "October";
        case 10 : return "November";
        case 11 : return "December";
        default : return null;
    }
};

var dateStringToDateObject = function (dateStr) {
    var dt = new Date(dateStr);
    var today = sugar.Date.create('today', {fromUTC: true});
    var tomorrow = sugar.Date.create('tomorrow', {fromUTC: true});

    var dayString;
    if (dateStr === today.toISOString()) {
        dayString = "today";
    } else if (dateStr === tomorrow.toISOString()) {
        dayString = "tomorrow";
    } else {
        dayString = dayIndexToDayString(dt.getDay());
    }

    return {
        day : dt.getDay(),
        day_string : dayString,
        month : dt.getMonth(),
        month_string : monthIndexToMonthString(dt.getMonth()),
        year : dt.getFullYear()
    }
};

var mapWxType = function (i) {
    var wxType = wxTypes[i];
    if(wxType.string.includes("(")) {
        wxType.string =  wxType.string.substr(0, wxType.string.indexOf("(")).trim();
    }
    wxType.string = wxType.string.toLowerCase();
    wxType["index"] = i;
    return wxType;
};

var windDirectionToWindDirectionString = function(d) {
    switch (d.substr(0,1).toUpperCase()) {
        case "N": return "Northerly";
        case "E": return "Easterly";
        case "S": return "Southerly";
        case "W": return "Westerly";
        default: return null;
    }
};

var mapVisibility = function (i) {
    var vis = visibilities[i.toUpperCase()];
    vis["index"] = i;
    return vis;
};

var uvToUvString = function(i) {
    var uv = {
        string: uvs[i].toLowerCase(),
        index: i
    };
    return uv;
};

var dailyDatapointToModel = function(wx) {

    var model = {};

    model.weather_type = mapWxType(wx.W);
    model.temperature = wx.Dm;
    model.feels_like_temperature = wx.FDm;
    model.wind_speed = wx.S;
    model.wind_gust = wx.Gn;
    model.wind_direction = windDirectionToWindDirectionString(wx.D);
    model.precipitation_probability = wx.PPd;
    model.visibility = mapVisibility(wx.V);
    model.uv = uvToUvString(wx.U);
    model.humidity = wx.Hn;

    return model;
};

module.exports = {
    "THREE_HOURLY": "3hourly",
    "DAILY": "daily",
    "HOURS_TO_MILLIS": hoursToMillis,
    "DAYS_TO_MILLIS": daysToMillis,
    "DAY_INDEX_TO_DAY_STRING" : dayIndexToDayString,
    "MONTH_INDEX_TO_MONTH_STRING" : monthIndexToMonthString,
    "DATE_TO_DATE_OBJECT" : dateStringToDateObject,
    "DAILY_DATAPOINT_TO_MODEL": dailyDatapointToModel
};