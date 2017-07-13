"use strict";

var sugar = require("sugar");
var winston = require("winston");
var math = require("mathjs");
var constants = require("../../constants");

exports.storeAsPreviousIntent = (session, results) => {
    if (results && results.response) {
        session.conversationData.previous_intent = results.response;
    }
    session.endDialog();
};

/*
 * Uses regular expressions to sanitize user responses in an attempt to extract key data.
 */
exports.sanitze = {

    /**
     * Parses the user's response to extract the user specified location.
     * Sets the session.conversationData.location property
     */
    location: (session, results, next) => {
        var str = session.conversationData.location.toLowerCase();
        winston.debug(`sanitizing [ ${str} ] for a location`);

        /* location regex
         * matches:
         * my location is exeter
         * in weston super mare
         * for bristol
         */
        var locationRegex = /(?:(\bin\b|\bfor\b|\bis\b)) \b([A-Za-z ]+)/g;
        var locationRegexResults = locationRegex.exec(str);
        var result;
        if (locationRegexResults) {
            result = locationRegexResults[locationRegexResults.length - 1];
        } else {
            var strRegex = /([A-Za-z ]+)/g;
            var strRegexResults = strRegex.exec(str);
            result = strRegexResults[strRegexResults.length - 1].trim();
        }
        result = sugar.String.capitalize(result, true, true);
        session.conversationData.location = result;
        return next();
    },

    /**
     * Parses the user's response to extract the users name.
     * Sets the session.userData.name property
     */
    name: (session, results, next) => {
        var str = session.userData.name.toLowerCase();
        winston.debug(`sanitizing [ ${str} ] for a name`);

        /* name regex
         * matches:
         * my name is Tom
         * call me Paul
         * it's Sarah
         * call me Tom Jones please
         */
        var nameRegex = /(?:(\bme\b|\bis\b|\bit's\b|\bi'm\b)) ([A-Za-z ]+(?:(?= \bplease\b))|.*)/gi;
        var regexResult = nameRegex.exec(str);
        var result;
        if (regexResult && regexResult.length === 3) {
            result = regexResult[2];
        } else {
            var strRegex = /([A-Za-z ]+)(?:(?= \bplease\b)|(?= \bis\b)|(?=!))/gi;
            var strRegexResults = strRegex.exec(str);
            if (strRegexResults) {
                result = strRegexResults[strRegexResults.length - 1].trim();
            } else {
                result = str;
            }
        }

        session.userData.name = sugar.String.capitalize(result, true, true);

        return next();
    },

    //TODO more work required to implement all edge cases for dates
    //TODO make this return a single object { 'fromDT': x, 'toDT': y }
    //deprecated now using LUIS builtin.datetimev2
    /**
     * Parses the user's input to extract the time bounding that a user may be looking for.
     * Returned as an array of ISO date time strings.
     */
    time_target: (session, results, next) => {
        var str = session.conversationData.time_target.toLowerCase();
        winston.debug(`sanitizing [ ${str} ] for a time_target`);

        /* next day regex
         * matches:
         * the day after
         * the next day
         */
        var nextDayRegex = /(?=.*\bday\b)((?=.*\bafter\b)|(?=.*\bnext\b)).*/g;
        var nextDayRegexResult = nextDayRegex.exec(str);

        /* day after next regex
         * matches:
         * the day after next
         */
        var dayAfterNextRegex = /(?=.*\bday\b)(?=.*\bafter\b)(?=.*\bnext\b).*/g;
        var dayAfterNextRegexResult = dayAfterNextRegex.exec(str);

        /* weekend regex
         * matches:
         * this weekend
         * at the weekend
         * on the weekend
         */
        var weekendRegex = /(?=(\w+)\b \bweekend\b).*/g;
        var weekendRegexResult = weekendRegex.exec(str);

        /* week regex (functionality not currently implemented)
         * matches:
         * this week
         * for the week
         * for next week
         * for last week
         */
        // var weekRegex = /(?=(\w+)\b \bweek\b).*/g;
        // var weekRegexResult = weekRegex.exec(str);

        /* month regex (functionality not currently implemented)
         * matches:
         * this month
         * for the month
         * for next month
         * for last month
         */
        // var monthRegex = /(?=(\w+)\b \bmonth\b).*/g;
        // var monthRegexResult = monthRegex.exec(str);

        /* year regex (functionality not currently implemented)
         * matches:
         * this year
         * for the year
         * for next year
         * for last year
         */
        // var yearRegex = /(?=(\w+)\b \byear\b).*/g;
        // var yearRegexResult = yearRegex.exec(str);

        /* day regex
         * matches:
         * this monday
         * last tuesday
         * next friday
         * on wednesday
         */
        var dayRegex = /(?=(\w+)\b \b(\w+day)\b).*/g;
        var dayRegexResult = dayRegex.exec(str);

        var result = new Array();
        if (nextDayRegexResult) {
            if (session.conversationData.time_target_dates && session.conversationData.time_target_dates.length >= 1) {
                var day = sugar.Date.addDays(sugar.Date.create(session.conversationData.time_target_dates[session.conversationData.time_target_dates.length - 1], {fromUTC: true}), 1);
                result.push(day.toISOString());
            } else {
                winston.error("next day regex matched but no previous time_target_date found");
            }
        } else if (dayAfterNextRegexResult) {
            if (session.conversationData.time_target_dates && session.conversationData.time_target_dates.length >= 1) {
                var day = sugar.Date.addDays(sugar.Date.create(session.conversationData.time_target_dates[session.conversationData.time_target_dates.length - 1], {fromUTC: true}), 2);
                result.push(day.toISOString());
            } else {
                winston.error("day after next regex matched but no previous time_target_date found");
            }
        } else if (weekendRegexResult) {
            var sat, sun;
            switch (weekendRegexResult[1]) {
                case "next" :
                case "last" :
                case "this" :
                    sat = sugar.Date.create(`${weekendRegexResult[1]} saturday`, {fromUTC: true});
                    break;
                default :
                    sat = sugar.Date.create("saturday", {fromUTC: true});
                    break;
            }
            //TODO only using saturday for this weekend to make the date handling in the responses easier
            // sun = sugar.Date.addDays(sugar.Date.create(sat.toISOString(), {fromUTC: true}), 1);
            result.push(sat.toISOString());
            // result.push(sun.toISOString());
        } else if (dayRegexResult) {
            var day;
            switch (dayRegexResult[1]) {
                case "next" :
                case "last" :
                case "this" :
                    day = sugar.Date.create(`${dayRegexResult[1]} ${dayRegexResult[2]}`, {fromUTC: true});
                    break;
                default :
                    day = sugar.Date.create(dayRegexResult[2], {fromUTC: true});
                    break;
            }
            result.push(day.toISOString());
        } else {
            var strRegex = /([A-Za-z ]+)/g;
            var strRegexResults = strRegex.exec(str);
            str = strRegexResults[strRegexResults.length - 1].trim();

            var day = sugar.Date.create(str, {fromUTC: true});
            result.push(day.toISOString());
        }

        session.conversationData.time_target_dates = result;
        return next();
    }
};

exports.summarize = {
    
    //TODO add more functionality to merging of significant weather.
    weather: (session, results, next) => {

        //TODO array of forecasts pre sorted to just the ones we are interested in
        var fcstArray = session.conversationData.datapoint.features[0].properties.time_series;

        function mapToTimeValue(arr, value) {
            return arr.map(x => {
                return {
                    "dt": x.time,
                    "v": x[value]
                }
            })
        }

        var screenTemperature = mapToTimeValue(fcstArray, "screen_temperature");
        var feels_like_temperature = mapToTimeValue(fcstArray, "feels_like_temperature");
        var probability_of_precipitation = mapToTimeValue(fcstArray, "probability_of_precipitation");
        var wind_speed = mapToTimeValue(fcstArray, "10m_wind_speed");
        var wind_gust = mapToTimeValue(fcstArray, "10m_wind_gust");
        var wind_direction = mapToTimeValue(fcstArray, "10m_wind_direction");
        var relative_humidity = mapToTimeValue(fcstArray, "relative_humidity");
        var visibility = mapToTimeValue(fcstArray, "visibility");
        var significant_weather= mapToTimeValue(fcstArray, "significant_weather");

        function min(a, b) {
            return a.v < b.v ? a : b;
        }

        function max(a, b) {
            return a.v > b.v ? a : b;
        }

        function getMaxMinMean(varMap) {

            return {
                max: varMap.reduce(max),
                min: varMap.reduce(min),
                mean: math.mean(varMap.map(x => x.v))
            }
        }

        function getMode(varMap) {

            //TODO fix this
            var m = math.mode(varMap.map(x => x.v));
            m = m[0];

            return {
                mode: m
            }
        }

        var wx = {
            "temperature": {
                "feels_like": getMaxMinMean(feels_like_temperature),
                "screen": getMaxMinMean(screenTemperature)
            },
            "probabiliity_of_precipitation": getMaxMinMean(probability_of_precipitation),
            "wind": {
                "gust": getMaxMinMean(wind_gust),
                "speed": getMaxMinMean(wind_speed),
                "direction": constants.MAP_WIND_DIRECTION(getMode(wind_direction).mode)
            },
            "relative_humidity": getMaxMinMean(relative_humidity),
            "visibility" : constants.MAP_VISIBILITY(getMode(visibility).mode),
            "significant_weather": constants.MAP_SIGNIFICANT_WEATHER_TYPE(getMode(significant_weather).mode)
        };

        session.conversationData.weather = wx;
        return next();
    }
};

exports.capture = {

    time_target: (session, results, next)  => {
        winston.debug("capturing time_target");
        var luis = session.conversationData.luis;
        if (luis && luis.entities) {
            var timeTargetEntity = luis.entities.filter(e => e.type === "time_target")[0];
            if (timeTargetEntity) {
                session.conversationData.time_target = timeTargetEntity.entity;
            }
        }
        if (!session.conversationData.time_target) {
            session.conversationData.time_target = "today";
        }
        return next();
    },

    location: (session, results, next) => {
        winston.debug("capturing location");
        var luis = session.conversationData.luis;
        if (luis && luis.entities) {
            var locationEntity = luis.entities.filter(e => e.type === "location")[0];
            if (locationEntity) {
                session.conversationData.location = locationEntity.entity;
            }
        }
        if (!session.conversationData.location) {
            session.beginDialog("prompt", {
                key: "prompts.weather.forecast.location",
                sessionDataKey: "conversationData.location",
                model: {user: session.userData}
            });
        } else {
            return next();
        }
    }



};
