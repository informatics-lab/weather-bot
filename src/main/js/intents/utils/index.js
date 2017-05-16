"use strict";

var sugar = require("sugar");
var winston = require("winston");
var constants = require("../../constants");

exports.storeAsPreviousIntent = (session, results) => {
    if(results && results.response) {
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
     * @param session
     * @param results
     * @param next
     * @returns {*}
     */
    location: (session, results, next) => {
        var str = results.response.toLowerCase();
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
            result = locationRegexResults[locationRegexResults.length-1];
        } else {
            var strRegex = /([A-Za-z ]+)/g;
            var strRegexResults = strRegex.exec(str);
            result = strRegexResults[strRegexResults.length-1].trim();
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
        var str = results.response.toLowerCase();
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
            if(strRegexResults) {
                result = strRegexResults[strRegexResults.length - 1].trim();
            } else {
                result = str;
            }
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
        var str = results.response.toLowerCase();
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
                var day = sugar.Date.addDays(sugar.Date.create(session.conversationData.time_target_dates[session.conversationData.time_target_dates.length-1], {fromUTC: true}), 1);
                result.push(day.toISOString());
            } else {
                winston.error("next day regex matched but no previous time_target_date found");
            }
        } else if (dayAfterNextRegexResult) {
            if (session.conversationData.time_target_dates && session.conversationData.time_target_dates.length >= 1) {
                var day = sugar.Date.addDays(sugar.Date.create(session.conversationData.time_target_dates[session.conversationData.time_target_dates.length-1], {fromUTC: true}), 2);
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
            var strRegex = /([A-Za-z ]+)/g;
            var strRegexResults = strRegex.exec(str);
            str = strRegexResults[strRegexResults.length-1].trim();

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
        var str = results.response.toLowerCase();
        var result = constants.WX_VARIABLES.filter((variable) => {
            return variable.accessories.includes(str);
        });

        if(!result || result.length === 0) {
            winston.error("unable to map the accessory [ %s ] to any of the current wx variables accessories");
        }

        return next({response: result});
    },

    variable: (session, results, next) => {
        var str = results.response.toLowerCase();

        var result = constants.WX_VARIABLES.filter((variable) => {
            return variable.synonyms.includes(str);
        });

        if(!result || result.length === 0) {
            winston.error("unable to map the variable [ %s ] to any of the current wx variables synonyms");
        }

        return next({response: result});
    }
};