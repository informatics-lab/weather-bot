var basicIntentBuilder = require("../basicIntentBuilder");
var variableThresholdIntentBuilder = require("./variableThresholdIntentBuilder");
var actionUtils = require('../utils/actionUtils');


var unknown = new basicIntentBuilder(`weather.action.${actionUtils.UNKNOWN}`);
var warm_dry = new variableThresholdIntentBuilder("weather.action", actionUtils.WARM_DRY, [], [
    { variable: "temperature.feels_like.min.v", comparison: "GT", optimal: 22, min: 15 },
    { variable: "probability_of_precipitation.max.v", comparison: "LT", max: 25, optimal: 5 }
]);

var dry = new variableThresholdIntentBuilder("weather.action", actionUtils.WARM_DRY, [], [
    { variable: "temperature.feels_like.min.v", comparison: "GT", optimal: 22, min: 15 },
    { variable: "probability_of_precipitation.max.v", comparison: "LT", max: 25, optimal: 5 }
]);

var laundry = new variableThresholdIntentBuilder("weather.action", actionUtils.LAUNDRY, [], [
    { variable: "probability_of_precipitation.max.v", comparison: "LT", max: 25, optimal: 5 }
]);

var warm_sunny_dry = new variableThresholdIntentBuilder("weather.action", actionUtils.WARM_SUNNY_DRY, [], [
    { variable: "probability_of_precipitation.max.v", comparison: "LT", max: 25, optimal: 5 }
]);

module.exports = (bot, persona) => {
    unknown(bot, persona);
    warm_dry(bot, persona);
    //TODO: add the others once configured and addeder to persona.
}