"use strict";

module.exports = {
    THREE_HOURLY: "3hourly",
    DAILY: "daily",
    HOURS_TO_MILLIS: function (n) {
        return n * 3600000;
    },
    DAYS_TO_MILLIS: function (n) {
        return n * 86400000;
    },
    
};