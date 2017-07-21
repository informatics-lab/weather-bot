/**
 * Created by tom on 04/05/2017.
 */

var basicIntentBuilder = require("../basicIntentBuilder");
var variableThresholdIntentBuilder = require("./variableThresholdIntentBuilder");

module.exports = (bot, persona) => {
    var unknown = new basicIntentBuilder("weather.variable.unknown");
    var sun = new variableThresholdIntentBuilder("weather.variable", "sun", ["sunny", "sunshine", "light", "sunlight"], [{ variable: "temperature.feels_like.mean", comparison: "GT", min: 10, optimal: 14 }, { variable: "probability_of_precipitation.max.v", comparison: "LT", optimal: 10, max: 15 }, { variable: "visibility.rating", comparison: "GT", min: 3, optimal: 4 }]);
    var rain = new variableThresholdIntentBuilder("weather.variable", "rain", ["rainfall", "rainy", "wet", "damp", "drizzle", "shower", "showers", "showery"], [{ variable: "probability_of_precipitation.max.v", comparison: "GT", min: 0, optimal: 100 }]);


    unknown(bot, persona);
    sun(bot, persona);
    rain(bot, persona);
}