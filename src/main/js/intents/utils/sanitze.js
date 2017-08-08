"use strict";

var sugar = require("sugar");
var winston = require("winston");
var convData = require('./convData');
var timeUtils = require('./timeUtils');

// TODO: Split out this in to moudles. 

/*
 * Uses regular expressions to sanitize user responses in an attempt to extract key data.
 */
module.exports = {

    /**
     * Parses the user's response to extract the user specified location.
     * Sets the convData 'location'  property
     */
    location: (session, results, next) => {
        var str = convData.get(session, 'location').toLowerCase();
        winston.debug(`sanitizing [ ${str} ] for a location`);

        /* location regex
         * matches:
         * my location is exeter
         * in weston super mare
         * SG8 9PZ
         * for SG89PZ
         * for bristol
         */
        var locationRegex = /(?:(\bin\b|\bfor\b|\bis\b)) \b([A-Za-z ]+)/g;
        var postCodeRegEx = /([Gg][Ii][Rr] 0[Aa]{2})|((([A-Za-z][0-9]{1,2})|(([A-Za-z][A-Ha-hJ-Yj-y][0-9]{1,2})|(([A-Za-z][0-9][A-Za-z])|([A-Za-z][A-Ha-hJ-Yj-y][0-9]?[A-Za-z]))))\s?[0-9][A-Za-z]{2})/
        var locationRegexResults = locationRegex.exec(str);
        var postCodeRegExResults = postCodeRegEx.exec(str);
        var result;
        if (postCodeRegExResults) {
            result = postCodeRegExResults[0].toUpperCase();
        } else if (locationRegexResults) {
            result = locationRegexResults[locationRegexResults.length - 1];
            result = sugar.String.capitalize(result, true, true);
        } else {
            var strRegex = /([A-Za-z ]+)/g;
            var strRegexResults = strRegex.exec(str);
            result = strRegexResults[strRegexResults.length - 1].trim();
            result = sugar.String.capitalize(result, true, true);
        }
        convData.addWithExpiry(session, 'location', result);
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

    datetimeV2: (session, results, next) => {

        var dt = convData.get(session, 'time_target');
        var dtType = dt.type.split('.')[2];
        var range = null;
        switch (dtType) {
            case "time":
                range = processTime(dt);
                break;
            case "date":
                range = processDate(dt);
                break;
            case "datetime":
                range = processDate(dt);
                break;
            case "daterange":
                range = processDateRange(dt);
                break;
            case "datetimerange":
                range = processDateRange(dt);
                break;
            default:
                throw `unrecognised datetimeV2 entity type [${dtType}]`;
        }

        dt.range = range;

        return next();

        function processTime(dt) {
            if (dt.resolution.values.length > 1) {
                /*
                 * multiple time options returned from luis
                 * how to decide which to use:
                 * if one of the options is before 7AM, choose the other
                 * otherwise, pick the closest to now.
                 */
                var candidates = dt.resolution.values.map(x => sugar.Date.create(x.value, { setUTC: true }));
                candidates = candidates.filter(x => {
                    var sevenAm = sugar.Date.create("07:00:00");
                    if (sugar.Date.isAfter(x, sevenAm)) {
                        return true;
                    }
                    return false;
                });

                if (candidates.length == 1) {
                    var fromDT = sugar.Date.reset(candidates[0], "hour");
                    var toDT = sugar.Date.addHours(sugar.Date.clone(fromDT), 1);
                    return {
                        fromDT: fromDT,
                        toDT: toDT
                    }
                } else {
                    candidates = candidates.map(x => {
                        return {
                            v: x,
                            s: sugar.Date.secondsUntil(x)
                        }
                    }).reduce((a, b) => {
                        a.s < b.s ? a.v : b.v
                    });
                    var fromDT = sugar.Date.reset(candidates, "hour");
                    var toDT = sugar.Date.addHours(sugar.Date.clone(fromDT), 1);
                    return {
                        fromDT: fromDT,
                        toDT: toDT
                    }
                }
            } else {
                var fromDT = sugar.Date.reset(sugar.Date.create(dt.resolution.values[0].value, { setUTC: true }), "hour");
                var toDT = sugar.Date.addHours(sugar.Date.clone(fromDT), 1);
                return {
                    fromDT: fromDT,
                    toDT: toDT
                }
            }
        }

        function processDate(dt) {
            var options = futureOptionsIfAvaliable(dt.resolution.values, 'value');
            var fromDT = sugar.Date.create(options[0].value, { setUTC: true }); // TODO: Not sure that we wan't to set UTC here, needs thinking about accross the code base.
            var toDT = sugar.Date.addDays(sugar.Date.clone(fromDT), 1);
            return {
                fromDT: fromDT,
                toDT: toDT
            }
        }

        function processDateRange(dt) {
            var options = futureOptionsIfAvaliable(dt.resolution.values, 'end');
            var fromDT = sugar.Date.reset(sugar.Date.create(options[0].start, { setUTC: true }), "hour");
            var toDT = sugar.Date.reset(sugar.Date.create(options[0].end, { setUTC: true }), "hour");
            return {
                fromDT: fromDT,
                toDT: toDT
            }
        }

        function futureOptionsIfAvaliable(options, key) {
            if (dt.resolution.values.length > 1) {
                var future = options.filter(d => !sugar.Date(d[key]).endOfDay().isPast().raw);
                options = (future.length >= 1) ? future : options;
            }
            return options;
        }

    },

    /**
     * filters the datapoint weather response to be just the set of forecasts we are interested in for the given time_target.range
     */
    weather: (session, results, next) => {
        var fcstArray = session.conversationData.datapoint.features[0].properties.time_series;

        var range = timeUtils.rangeStrsToObjs(convData.get(session, 'time_target').range);

        fcstArray = fcstArray.filter(x => {
            var dt = sugar.Date.create(x.time);
            if (sugar.Date.isBetween(dt, range.fromDT, range.toDT)) {
                return true;
            }
            return false;
        });

        session.conversationData.forecast = fcstArray;
        return next();
    }
};