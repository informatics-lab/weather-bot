"use strict";

var wxVariables = require("../resources/wx_variables");
var wxTypes = require("../resources/datapoint/weatherTypes");

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
    return {
        day : dt.getDay(),
        day_string : dayIndexToDayString(dt.getDay()),
        month : dt.getMonth(),
        month_string : monthIndexToMonthString(dt.getMonth()),
        year : dt.getFullYear()
    }
};

var wxTypeIndexToWxTypeString = function (i) {
    var wxType = wxTypes[i];
    if(wxType.includes("(")) {
        wxType =  wxType.substr(0, wxType.indexOf("(")).trim();
    }
    return wxType.toLowerCase();
};

module.exports = {
    "THREE_HOURLY": "3hourly",
    "DAILY": "daily",
    "HOURS_TO_MILLIS": hoursToMillis,
    "DAYS_TO_MILLIS": daysToMillis,
    "WX_VARIABLES": wxVariables,
    "DAY_INDEX_TO_DAY_STRING" : dayIndexToDayString,
    "MONTH_INDEX_TO_MONTH_STRING" : monthIndexToMonthString,
    "DATE_TO_DATE_OBJECT" : dateStringToDateObject,
    "WX_TYPE_INDEX_TO_WX_TYPE_STRING": wxTypeIndexToWxTypeString
};