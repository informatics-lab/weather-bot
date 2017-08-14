"use strict";

var contextInspectionBuilder = require('./contextInspectionBuilder');

exports.location = new contextInspectionBuilder("context.location", "location");
exports.date = new contextInspectionBuilder("context.date", "time_target.text");
