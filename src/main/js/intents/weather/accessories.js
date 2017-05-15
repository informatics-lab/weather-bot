/**
 * Created by tom on 04/05/2017.
 */

var basicIntentBuilder = require("../basicIntentBuilder");
var accessoryIntentBuilder = require("./accessoryIntentBuilder");

exports.unknown = new basicIntentBuilder("weather.accessory.unknown");
exports.coat = new accessoryIntentBuilder("weather.accessory", "coat", ["jacket", "anorak"], [{variable:"feels_like_temperature", comparison:"LT", optimal:7, max:12}, {variable:"precipitation_probability", comparison:"GT", min:20, optimal:50}]);
exports.umbrella = new accessoryIntentBuilder("weather.accessory", "umbrella", ["brolly"], [{variable:"precipitation_probability", comparison:"GT", min:20, optimal:60}]);
exports.jumper = new accessoryIntentBuilder("weather.accessory", "jumper", ["fleece","sweater","hoodie","pullover"], [{variable:"feels_like_temperature", comparison:"LT", optimal:12, max:15}]);