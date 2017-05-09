"use strict";


function scoring() {

    function mapRange(value, low1, high1, low2, high2) {
        return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
    }

    /*
     * function ‾\_
     */
    function lessThan(endOptimal, maxValue, value) {
        var result = null;
        if(value <= endOptimal) {
            result = 1.0;
        } else if (value >= maxValue) {
            result = 0.0;
        } else {
            result = mapRange(value, endOptimal, maxValue, 0, 1);
        }
        return result;
    }

    /*
     * function _/‾
     */
    function greaterThan(minValue, startOptimal, value) {
        var result = null;

        return result;
    }

    function between(minValue, optimal, maxValue, value) {

    }

    return {
        lessThan : lessThan,
        greaterThan : greaterThan,
        between: between
    }

}

module.exports = scoring;