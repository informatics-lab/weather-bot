/**
 * Created by tom on 04/05/2017.
 */

var basicIntentBuilder = require("../basicIntentBuilder");
var accessoryIntentBuilder = require("./accessoryIntentBuilder");

exports.unknown = new basicIntentBuilder("weather.accessory.unknown");
exports.coat = new accessoryIntentBuilder("weather.accessory", "coat", ["jacket"], [{variable:"feels_like_temperature", comparison:"LT", optimal:7, max:12}, {variable:"precipitation_probability", comparison:"GT", min:25, optimal:50}]);
exports.umbrella = new accessoryIntentBuilder("weather.accessory", "umbrella", ["brolly"], [{variable:"precipitation_probability", comparison:"GT", min:40, optimal:60}]);