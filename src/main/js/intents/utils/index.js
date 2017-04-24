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
        winston.debug(`sanitizing [${str}] for a location`);

        /* location regex
         * matches:
         * my location is exeter
         * in weston super mare
         * for bristol
         */
        var locationRegex = /(?:(\bin\b|\bfor\b|\bis\b)) \b(.*)/g;
        var locationRegexResults = locationRegex.exec(str);
        if (locationRegexResults && locationRegexResults.length === 2) {
            session.conversationData.location = locationRegexResults[1];
        } else {
            session.conversationData.location = str;
        }
        return next();
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
        winston.debug(`sanitizing [${str}] for a name`);

        /* name regex
         * matches:
         * my name is Tom
         * call me Paul
         * it's Sarah
         */
        var nameRegex = /(?:(\bme\b|\bis\b|\bit's\b)) (\w+)/g;
        var regexResult = nameRegex.exec(str);
        if (regexResult && regexResult.length === 3) {
            session.userData.name = regexResult[2];
        } else {
            session.userData.name = str;
        }

        return next();
    },

    //TODO more work required to implement all edge cases for dates
    /**
     * Parses the user's input to extract the time bounding that a user may be looking for
     * @param session
     * @param results
     * @param next
     */
    time_target: (session, results, next) => {
        var str = results.response;
        winston.debug(`sanitizing [${str}] for a time_target`);

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
        var weekRegex = /(?=(\w+)\b \bweek\b).*/g;
        var weekRegexResult = weekRegex.exec(str);

        /* month regex (functionality not currently implemented)
         * matches:
         * this month
         * for the month
         * for next month
         * for last month
         */
        var monthRegex = /(?=(\w+)\b \bmonth\b).*/g;
        var monthRegexResult = monthRegex.exec(str);

        /* year regex (functionality not currently implemented)
         * matches:
         * this year
         * for the year
         * for next year
         * for last year
         */
        var yearRegex = /(?=(\w+)\b \byear\b).*/g;
        var yearRegexResult = yearRegex.exec(str);

        /* day regex
         * matches:
         * this monday
         * last tuesday
         * next friday
         * on wednesday
         */
        var dayRegex = /(?=(\w+)\b \b(\w+day)\b).*/g;
        var dayRegexResult = dayRegex.exec(str);

        var d;
        if (nextDayRegexResult) {
            if (session.conversationData.time_target_date) {
                d = sugar.Date.addDays(sugar.Date.create(session.conversationData.time_target_date, {fromUTC: true}), 1);
            } else {
                winston.error("next day regex matched but no previous time_target_date found");
            }
        } else if (dayAfterNextRegexResult) {
            if (session.conversationData.time_target_date) {
                d = sugar.Date.addDays(sugar.Date.create(session.conversationData.time_target_date, {fromUTC: true}), 2);
            } else {
                winston.error("day after next regex matched but no previous time_target_date found");
            }
        } else if (weekendRegexResult) {
            var sat, sun;
            switch (weekendRegexResult[0]) {
                case "next" :
                case "last" :
                case "this" :
                    sat = sugar.Date.create(`${weekendRegexResult[0]} saturday`, {fromUTC: true});
                    break;
                default :
                    sat = sugar.Date.create("saturday", {fromUTC: true});
                    break;
            }
            sun = sugar.Date.addDays(sat, 1);
            d = new Array(sat.toISOString(), sun.toISOString());
        } else if (dayRegexResult) {
            var day;
            switch (dayRegexResult[0]) {
                case "next" :
                case "last" :
                case "this" :
                    day = sugar.Date.create(`${dayRegexResult[0]} ${dayRegexResult[1]}`, {fromUTC: true});
                    break;
                default :
                    day = sugar.Date.create(dayRegexResult[1], {fromUTC: true});
                    break;
            }
            d = day.toISOString();
        } else {
            var day = sugar.Date.create(session.conversationData.time_target, {fromUTC: true});
            d = day.toISOString();
        }
        session.conversationData.time_target_date = d;
        return next();
    }
};

/*
 * Attempts to translate between user defined variables and weather phenomena
 */
exports.translate = {

    accessory: (session, results, next) => {
        var str = results.response;
        var accessory;

        //TODO implement accessory logic

        session.conversationData.accessory = accessory;
        return next();
    },

    variable: (session, results, next) => {
        var str = results.response;
        var wxVariable;
        switch (str) {
            case "nice" :
                wxVariable = new Array("temperature", "sunshine");
                break;
            case "hot" :
            case "cold" :
            case "warm" :
            case "chilly" :
                wxVariable = "temperature";
                break;
            case "wet" :
            case "dry" :
            case "rain" :
                wxVariable = "rainfall";
                break;
            case "wind" :
            case "windy" :
                wxVariable = "wind";
                break;
            case "sunny" :
            case "cloudy" :
                wxVariable = "sunshine";
                break;
            default:
                winston.warn(`attempt to translate [${str}] for variable failed`);
                break;
        }
        session.conversationData.variable = wxVariable;
        return next();
    }
};