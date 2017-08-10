/**
 * Created by tom on 04/05/2017.
 */

var basicIntentBuilder = require("../basicIntentBuilder");
var variableThresholdIntentBuilder = require("./variableThresholdIntentBuilder");

module.exports = (bot, persona) => {
    var unknown = new basicIntentBuilder("weather.variable.unknown");

    var clarity = new variableThresholdIntentBuilder(
      "weather.variable",
      "clarity",
      ["sun", "sunny", "sunshine", "clear", "cloudy", "overcast", "dreary", "nice", "good", "bad", "rubbish", "ok"],
      [
        {variable: "clear_score", comparison: "GT", min: -1, optimal: 1}
      ]);

    var rain = new variableThresholdIntentBuilder(
      "weather.variable",
      "rain",
      ["rainfall", "rainy", "wet", "damp", "drizzle", "shower", "showers", "showery"],
      [
        {variable: "probability_of_precipitation.max.v", comparison: "GT", min: 0, optimal: 100}
      ]);

    var temperature = new variableThresholdIntentBuilder(
      "weather.variable",
      "temperature",
      ["hot", "warm", "baking", "toasty", "cold", "chilly", "freezing", "mild"],
      [
        {variable: "temperature.feels_like.max.v", comparison: "GT", min: -5, optimal: 30}
      ]);


    unknown(bot, persona);
    clarity(bot, persona);
    rain(bot, persona);
    temperature(bot, persona);
}
