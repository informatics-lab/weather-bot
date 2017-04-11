"use strict";

var basicIntentBuilder = require("../../basicIntentBuilder");

exports.good = new basicIntentBuilder("smalltalk.courtesy.good");
exports.no_problem = new basicIntentBuilder("smalltalk.courtesy.no_problem");
exports.please = new basicIntentBuilder("smalltalk.courtesy.please");
exports.sorry = new basicIntentBuilder("smalltalk.courtesy.sorry");
exports.thank_you = new basicIntentBuilder("smalltalk.courtesy.thank_you");
exports.well_done = new basicIntentBuilder("smalltalk.courtesy.well_done");
exports.you_are_welcome = new basicIntentBuilder("smalltalk.courtesy.you_are_welcome");