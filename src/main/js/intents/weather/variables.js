/**
 * Created by tom on 04/05/2017.
 */

var basicIntentBuilder = require("../basicIntentBuilder");
var variableThresholdIntentBuilder = require("./variableThresholdIntentBuilder");

exports.unknown = new basicIntentBuilder("weather.variable.unknown");
exports.sun = new variableThresholdIntentBuilder("weather.variable", "sun", ["sunny", "sunshine", "light", "sunlight"], [{variable:"feels_like_temperature", comparison:"GT", min:10, optimal:14}, {variable:"precipitation_probability", comparison:"LT", optimal:10, max:15}, {variable:"visibility.rating", comparison:"GT", min:3, optimal:4}]);
exports.rain = new variableThresholdIntentBuilder("weather.variable", "rain", ["rainfall", "rainy", "wet", "damp", "drizzle", "shower", "showers", "showery"], [{variable:"precipitation_probability", comparison:"GT", min:10, optimal:15}]);