"use strict";


function mapRange(value, low1, high1, low2, high2) {
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}

/*
 * no min value
 * function ‾\_
 */
function lessThan(min, optimal, max, value) {
    var result = null;
    if (value <= optimal) {
        result = 1.0;
    } else if (value >= max) {
        result = 0.0;
    } else {
        result = mapRange(value, optimal, max, 1, 0).toFixed(2);
    }
    return result;
}

/*
 * no max value
 * function _/‾
 */
function greaterThan(min, optimal, max, value) {
    var result = null;
    if (value <= min) {
        result = 0.0;
    } else if (value >= optimal) {
        result = 1.0;
    } else {
        result = mapRange(value, min, optimal, 0, 1).toFixed(2);
    }
    return result;
}

/*
 * function _/\_
 */
function between(min, optimal, max, value) {
    var result = null;
    if (value <= min) {
        result = 0.0;
    } else if (value > min && value < optimal) {
        result = mapRange(value, min, optimal, 0, 1).toFixed(2);
    } else if (value === optimal) {
        result = 1.0;
    } else if (value > optimal && value < max) {
        result = mapRange(value, optimal, max, 1, 0).toFixed(2);
    } else if (value >= max) {
        result = 0.0
    }
    return result;
}

function getScoringFunction(str) {
    switch (str) {
        case "GT" :
            return greaterThan;
        case "LT" :
            return lessThan;
        case "B" :
            return between;
        default:
            return null;
    }
}

exports.lessThan = lessThan;
exports.greaterThan = greaterThan;
exports.between = between;
exports.getScoringFunction = getScoringFunction;