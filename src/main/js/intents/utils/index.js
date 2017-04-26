"use strict";

var sugar = require("sugar");
var winston = require("winston");

exports.storeAsPreviousIntent = (session) => {
    if (session.sessionState) {
        if (session.sessionState.callstack && session.sessionState.callstack.length >= 2) {
            var previousIntent = session.sessionState.callstack[session.sessionState.callstack.length - 1].id.substr(2);
            session.conversationData.previous_intent = previousIntent;
        }
        session.endDialog();
    }
};

/*
 * Uses regular expressions to sanitize user responses in an attempt to extract key data.
 */
exports.sanitze = {

    /**
     * Parses the user's response to extract the user specified location.
     * Sets the session.conversationData.location property
     * @param session
     * @param results
     * @param next
     * @returns {*}
     */
    location: (session, results, next) => {
        var str = results.response;
        winston.debug(`sanitizing [ ${str} ] for a location`);

        /* location regex
         * matches:
         * my location is exeter
         * in weston super mare
         * for bristol
         */
        var locationRegex = /(?:(\bin\b|\bfor\b|\bis\b)) \b(.*)/g;
        var locationRegexResults = locationRegex.exec(str);
        var result;
        if (locationRegexResults && locationRegexResults.length === 2) {
            result = locationRegexResults[1];
        } else {
            result = str;
        }
        return next({response: result});
    },

    /**
     * Parses the user's response to extract the users name.
     * Sets the session.userData.name property
     * @param session
     * @param results
     * @param next
     * @returns {*}
     */
    name: (session, results, next) => {
        var str = results.response;
        winston.debug(`sanitizing [ ${str} ] for a name`);

        /* name regex
         * matches:
         * my name is Tom
         * call me Paul
         * it's Sarah
         */
        var nameRegex = /(?:(\bme\b|\bis\b|\bit's\b)) (\w+)/g;
        var regexResult = nameRegex.exec(str);
        var result;
        if (regexResult && regexResult.length === 3) {
            result = regexResult[2];
        } else {
            result = str;
        }

        return next({response: result});
    },

    //TODO more work required to implement all edge cases for dates
    /**
     * Parses the user's input to extract the time bounding that a user may be looking for.
     * Returned as an array of ISO date time strings.
     * @param session
     * @param results
     * @param next
     */
    time_target: (session, results, next) => {
        var str = results.response;
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
            if (session.conversationData.time_target_date) {
                var day = sugar.Date.addDays(sugar.Date.create(session.conversationData.time_target_date, {fromUTC: true}), 1);
                result.push(day.toISOString());
            } else {
                winston.error("next day regex matched but no previous time_target_date found");
            }
        } else if (dayAfterNextRegexResult) {
            if (session.conversationData.time_target_date) {
                var day = sugar.Date.addDays(sugar.Date.create(session.conversationData.time_target_date, {fromUTC: true}), 2);
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
            sun = sugar.Date.addDays(sugar.Date.create(sat.toISOString(), {fromUTC: true}), 1);
            result.push(sat.toISOString());
            result.push(sun.toISOString());
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
            var day = sugar.Date.create(str, {fromUTC: true});
            result.push(day.toISOString());
        }

        return next({response: result});
    }
};

/*
 * Attempts to translate between user defined variables and weather phenomena
 */
exports.translate = {

    accessory: (session, results, next) => {
        var str = results.response;
        var result;

        //TODO implement accessory logic

        return next({response: result});
    },

    variable: (session, results, next) => {
        var str = results.response;
        var result;
        switch (str) {
            case "nice" :
                result = new Array("temperature", "sunshine");
                break;
            case "hot" :
            case "cold" :
            case "warm" :
            case "chilly" :
                result = "temperature";
                break;
            case "wet" :
            case "dry" :
            case "rain" :
                result = "rainfall";
                break;
            case "wind" :
            case "windy" :
                result = "wind";
                break;
            case "sunny" :
            case "cloudy" :
                result = "sunshine";
                break;
            default:
                winston.warn(`attempt to translate [${str}] for variable failed`);
                break;
        }
        return next({response: result});
    }
};