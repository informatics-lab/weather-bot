"use strict";

var sugar = require("sugar");
var winston = require("winston");
var math = require("mathjs");
var constants = require("../../constants");
var actionUtils = require('./actionUtils');

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

    //TODO: make this return a single object { 'fromDT': x, 'toDT': y }
    datetimeV2: (session, results, next) => {

        var dt = session.conversationData.time_target;
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
                range = processDateTime(dt);
                break;
            case "daterange":
                range = processDateRange(dt);
                break;
            case "datetimerange":
                range = processDateTimeRange(dt);
                break;
            default:
                throw `unrecognised datetimeV2 entity type [${dtType}]`;
        }

        session.conversationData.time_target.range = range;

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
            var fromDT = sugar.Date.create(dt.resolution.values[0].value, { setUTC: true });
            var toDT = sugar.Date.addDays(sugar.Date.clone(fromDT), 1);
            return {
                fromDT: fromDT,
                toDT: toDT
            }
        }

        function processDateTime(dt) {

        }

        function processDateRange(dt) {
            var fromDT = sugar.Date.reset(sugar.Date.create(dt.resolution.values[0].start, { setUTC: true }), "hour");
            var toDT = sugar.Date.reset(sugar.Date.create(dt.resolution.values[0].end, { setUTC: true }), "hour");
            return {
                fromDT: fromDT,
                toDT: toDT
            }
        }

        function processDateTimeRange(dt) {
            return processDateRange(dt);
        }

    },

    /**
     * filters the datapoint weather response to be just the set of forecasts we are interested in for the given time_target.range
     */
    weather: (session, results, next) => {
        var fcstArray = session.conversationData.datapoint.features[0].properties.time_series;
        var range = session.conversationData.time_target.range;

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

exports.summarize = {

    //TODO add more functionality to merging of weather forecasts.
    weather: (session, results, next) => {

        var fcstArray = session.conversationData.forecast;

        if (!fcstArray || fcstArray.length == 0) {
            session.conversationData.weather = null;
            return next();
        }

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
        var uv = mapToTimeValue(fcstArray, "uv_index");
        var significant_weather = mapToTimeValue(fcstArray, "significant_weather");

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
                mean: math.round(math.mean(varMap.map(x => x.v)))
            }
        }

        function getMode(varMap) {

            //TODO fix this : currently if more than 1 mode selects the first
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
            "probability_of_precipitation": getMaxMinMean(probability_of_precipitation),
            "wind": {
                "gust": getMaxMinMean(wind_gust),
                "speed": getMaxMinMean(wind_speed),
                "direction": constants.MAP_WIND_DIRECTION(getMode(wind_direction).mode)
            },
            "relative_humidity": getMaxMinMean(relative_humidity),
            "visibility": constants.MAP_VISIBILITY(getMode(visibility).mode),
            "uv": constants.MAP_UV_INDEX(uv.reduce(max).v),
            "significant_weather": constants.MAP_SIGNIFICANT_WEATHER_TYPE(getMode(significant_weather).mode)
        };

        session.conversationData.weather = wx;
        return next();
    }
};

exports.capture = {

    /**
     * captures the luis builtin entity datetimeV2
     */
    datetimeV2: (session, results, next) => {
        winston.debug("capturing datetimeV2");
        var luis = session.conversationData.luis;
        if (luis && luis.entities) {
            var datetimeEntity = luis.entities.filter(e => e.type.includes("datetimeV2"))[0];
            if (datetimeEntity) {
                session.conversationData.time_target = datetimeEntity;
            }
        }
        // TODO: record when we stored the datetime and throw away if older than say 1h.
        // TODO: We have to guess at the users timezone. Let's assume it's the same as the servers.
        if (!session.conversationData.time_target) {
            session.conversationData.time_target = {
                "entity": "today",
                "type": "builtin.datetimeV2.datetimerange",
                "resolution": {
                    "values": [{
                        "type": "datetimerange",
                        "start": sugar.Date.format(sugar.Date.create("now"), "{yyyy}-{MM}-{dd} {HH}:{mm}:{ss}"),
                        "end": sugar.Date.format(sugar.Date.endOfDay(sugar.Date.create("now")), "{yyyy}-{MM}-{dd} {HH}:{mm}:{ss}")
                    }]
                }
            };
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
                key: `prompts.${session.conversationData.intent}.location`,
                sessionDataKey: "conversationData.location",
                model: { user: session.userData }
            });
        } else {
            return next();
        }
    },

    accessory: (session, results, next) => {
        winston.debug("capturing accessory");
        var luis = session.conversationData.luis;
        if (luis && luis.entities) {
            var accessoryEntity = luis.entities.filter(e => e.type === "accessory")[0];
            if (accessoryEntity) {
                session.conversationData.accessory = accessoryEntity.entity;
            }
        }
        if (!session.conversationData.accessory) {
            winston.warn("no accessory found in [ %s ]", session.message.text);
            var unknown = "weather.accessory.unknown";
            session.cancelDialog();
            session.beginDialog(unknown);
        }
        return next();
    },

    action: (session, results, next) => {
        winston.debug("capturing action");
        var luis = session.conversationData.luis;
        // Clear previous actions. We don't want to remember between conversations
        session.conversationData.action = null;
        session.conversationData.action_type = null;
        if (luis && luis.entities) {
            var actionEntity = luis.entities.filter(e => e.type === "action")[0];
            if (actionEntity) {
                session.conversationData.action = actionEntity.entity;
                session.conversationData.action_type = actionUtils.action_type(actionEntity.entity);
            }
        }
        if (!session.conversationData.action_type) {
            session.conversationData.action_type = actionUtils.UNKNOWN;
        }
        return next();
    },

    variable: (session, results, next) => {
        winston.debug("capturing variable");
        var luis = session.conversationData.luis;
        if (luis && luis.entities) {
            var variableEntity = luis.entities.filter(e => e.type === "variable")[0];
            if (variableEntity) {
                session.conversationData.variable = variableEntity.entity;
            }
        }
        if (!session.conversationData.variable) {
            winston.warn("no variable found in [ %s ]", session.message.text);
            var unknown = "weather.variable.unknown";
            session.cancelDialog();
            session.beginDialog(unknown);
        }
        return next();
    }

};