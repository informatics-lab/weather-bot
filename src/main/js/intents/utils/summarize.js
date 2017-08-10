"use strict";

var math = require("mathjs");
var constants = require("../../constants");

module.exports = {

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


        var temParam = (fcstArray[0] && fcstArray[0]['screen_temperature']) ? "screen_temperature" : "3_hour_max_screen_temperature"
        var screenTemperature = mapToTimeValue(fcstArray, temParam);
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
            varMap = varMap.filter(i => i.v != null);
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
