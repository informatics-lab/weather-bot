"use strict";

var sugar = require("sugar");

module.exports = {
    rangeStrsToObjs: function(range) {
        return {
            fromDT: sugar.Date.create(range.fromDT),
            toDT: sugar.Date.create(range.toDT)
        }
    }
}