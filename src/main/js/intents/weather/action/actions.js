var actionUtils = require('../../utils/actionUtils');
var variableThresholdIntentBuilder = require("../variableThresholdIntentBuilder");
var warm_dry = new variableThresholdIntentBuilder("weather.action", actionUtils.WARM_DRY, [], [
        { variable: "temperature.feels_like.min.v", comparison: "GT", optimal: 22, min: 15 },
        { variable: "probability_of_precipitation.max.v", comparison: "LT", max: 25, optimal: 5 }
    ],
    'product'
);

var dry = new variableThresholdIntentBuilder("weather.action", actionUtils.DRY, [], [
    { variable: "probability_of_precipitation.max.v", comparison: "LT", max: 100, optimal: 0 } // Setting like this allows the certanty required to be set in the persona file.
]);

var wet = new variableThresholdIntentBuilder("weather.action", actionUtils.WET, [], [
    { variable: "probability_of_precipitation.max.v", comparison: "GT", min: 0, optimal: 100 } // Setting like this allows the certanty required to be set in the persona file.
]);

var laundry = new variableThresholdIntentBuilder("weather.action", actionUtils.LAUNDRY, [], [
        { variable: "probability_of_precipitation.max.v", comparison: "LT", max: 50, optimal: 5 },
        { variable: "wind.speed.mean", comparison: "GT", min: -8, optimal: 8 } // this should give a minimum score of 0.5 for this parameter, since speed is always +ve
    ],
    'product'
);
module.exports = (bot, persona) => {
    warm_dry(bot, persona);
    wet(bot, persona);
    dry(bot, persona);
    laundry(bot, persona);
}