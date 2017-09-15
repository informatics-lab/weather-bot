"use strict";

var wxTypes = require("../resources/datapoint/weatherTypes");
var visibilities = require("../resources/datapoint/visibilities"); // TODO: I added 'G' and 'M' to this event thought they arn't in the specification as with datapoint 2 I kept getting 'G'
var uvs = require("../resources/datapoint/uvIndexes");
var sugar = require("sugar");

var daysToMillis = function(n) {
    return n * 86400000;
};

var hoursToMillis = function(n) {
    return n * 3600000;
};

var minutesToMillis = function(n) {
    return n * 60000;
}

var dayIndexToDayString = function(i) {
    switch (i) {
        case 0:
            return "Sunday";
        case 1:
            return "Monday";
        case 2:
            return "Tuesday";
        case 3:
            return "Wednesday";
        case 4:
            return "Thursday";
        case 5:
            return "Friday";
        case 6:
            return "Saturday";
        default:
            return null;
    }
};

var monthIndexToMonthString = function(i) {
    switch (i) {
        case 0:
            return "January";
        case 1:
            return "February";
        case 2:
            return "March";
        case 3:
            return "April";
        case 4:
            return "May";
        case 5:
            return "June";
        case 6:
            return "July";
        case 7:
            return "August";
        case 8:
            return "September";
        case 9:
            return "October";
        case 10:
            return "November";
        case 11:
            return "December";
        default:
            return null;
    }
};

var dateStringToDateObject = function(dateStr) {
    var dt = new Date(dateStr);
    var today = sugar.Date.create('today', { fromUTC: true });
    var tomorrow = sugar.Date.create('tomorrow', { fromUTC: true });

    var dayString;
    if (dateStr === today.toISOString()) {
        dayString = "today";
    } else if (dateStr === tomorrow.toISOString()) {
        dayString = "tomorrow";
    } else {
        dayString = dayIndexToDayString(dt.getDay());
    }

    return {
        day: dt.getDay(),
        day_string: dayString,
        month: dt.getMonth(),
        month_string: monthIndexToMonthString(dt.getMonth()),
        year: dt.getFullYear()
    }
};

var mapWxType = function(i) {
    var wxType = wxTypes[i];
    wxType["index"] = i;
    return wxType;
};

var mapWindDirection = function(d) {
    var str = null;
    //TODO add more wind directions
    switch (d.substr(0, 1).toUpperCase()) {
        case "N":
            str = "Northerly";
            break;
        case "E":
            str = "Easterly";
            break;
        case "S":
            str = "Southerly";
            break;
        case "W":
            str = "Westerly";
            break;
        default:
            str = null;
            break;
    }
    return {
        index: d,
        string: str
    };
};

var mapVisibility = function(i) {
    var vis = visibilities[i.toUpperCase()];
    vis["index"] = i;
    return vis;
};

var mapUvIndex = function(i) {
    var uv = {
        string: uvs[i].toLowerCase(),
        index: i
    };
    return uv;
};

module.exports = {
    "HOURLY": "hourly",
    "THREE_HOURLY": "three-hourly",
    "DAILY": "daily",

    "HOURS_TO_MILLIS": hoursToMillis,
    "DAYS_TO_MILLIS": daysToMillis,
    "MINUTES_TO_MILLIS": minutesToMillis,

    "DAY_INDEX_TO_DAY_STRING": dayIndexToDayString,
    "MONTH_INDEX_TO_MONTH_STRING": monthIndexToMonthString,
    "DATE_TO_DATE_OBJECT": dateStringToDateObject,

    "MAP_SIGNIFICANT_WEATHER_TYPE": mapWxType,
    "MAP_VISIBILITY": mapVisibility,
    "MAP_WIND_DIRECTION": mapWindDirection,
    "MAP_UV_INDEX": mapUvIndex
};