/**
 * Created by tom on 04/05/2017.
 */

var basicIntentBuilder = require("../basicIntentBuilder");
var variableThresholdIntentBuilder = require("./variableThresholdIntentBuilder");

exports.unknown = new basicIntentBuilder("weather.accessory.unknown");
exports.coat = new variableThresholdIntentBuilder("weather.accessory", "coat", ["jacket", "anorak", "mac"], [{variable:"feels_like_temperature", comparison:"LT", optimal:7, max:12}, {variable:"precipitation_probability", comparison:"GT", min:20, optimal:50}]);
exports.umbrella = new variableThresholdIntentBuilder("weather.accessory", "umbrella", ["brolly"], [{variable:"precipitation_probability", comparison:"GT", min:20, optimal:60}]);
exports.jumper = new variableThresholdIntentBuilder("weather.accessory", "jumper", ["fleece", "sweater", "hoodie", "pullover"], [{variable:"feels_like_temperature", comparison:"LT", optimal:12, max:15}]);
exports.sun_cream = new variableThresholdIntentBuilder("weather.accessory", "sun_cream", ["sun_screen", "sunscreen"], [{variable:"uv.index", comparison:"GT", min:2, optimal:3}]);