/**
 * Created by tom on 04/05/2017.
 */

var basicIntentBuilder = require("../basicIntentBuilder");
var variableThresholdIntentBuilder = require("./variableThresholdIntentBuilder");

var unknown = new basicIntentBuilder("weather.accessory.unknown");
var coat = new variableThresholdIntentBuilder("weather.accessory", "coat", ["jacket", "anorak", "mac", "cagoule"], [{ variable: "temperature.feels_like.min.v", comparison: "LT", optimal: 7, max: 12 }, { variable: "probability_of_precipitation.max.v", comparison: "GT", min: 20, optimal: 50 }]);
var umbrella = new variableThresholdIntentBuilder("weather.accessory", "umbrella", ["brolly"], [{ variable: "probability_of_precipitation.max.v", comparison: "GT", min: 20, optimal: 60 }]);
var jumper = new variableThresholdIntentBuilder("weather.accessory", "jumper", ["fleece", "sweater", "hoodie", "pullover"], [{ variable: "temperature.feels_like.min.v", comparison: "LT", optimal: 12, max: 15 }]);
var sun_cream = new variableThresholdIntentBuilder("weather.accessory", "sun_cream", ["sun_screen", "sunscreen"], [{ variable: "uv.index", comparison: "GT", min: 2, optimal: 3 }]);


module.exports = (bot, persona, datapoint, gmaps) => {
    unknown(bot, persona);
    coat(bot, persona);
    umbrella(bot, persona);
    jumper(bot, persona);
    sun_cream(bot, persona);
}