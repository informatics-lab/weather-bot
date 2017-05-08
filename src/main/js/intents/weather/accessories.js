/**
 * Created by tom on 04/05/2017.
 */

var basicIntentBuilder = require("../basicIntentBuilder");
var accessoryIntentBuilder = require("./accessoryIntentBuilder");

exports.unknown = new basicIntentBuilder("weather.accessory.unknown");
exports.coat = new accessoryIntentBuilder("weather.accessory.coat", [{variable:"temperature", comparison:"LT", value:7}, {variable:"precipitation_probability", comparison:"GT", value:50}]);