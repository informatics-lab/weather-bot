"use strict";

exports.DRY = 'dry';
exports.WARM_DRY = 'warm_dry';
exports.LAUNDRY = 'laundry';
exports.UNKNOWN = 'unknown';
exports.WET = 'wet';

exports.action_type = function(action) {
    action = action.toLowerCase();
    if (action.search(/(do|the|hang|out|dry).*(wash|laundry)/) >= 0) {
        return exports.LAUNDRY;
    }
    if (action.search(/(outdoor|walk|hike|bike|cycle|jog|run)/) >= 0) {
        return exports.DRY;
    }
    if (action.search(/((eat.*(out|alfresco))|(bbq|barby|barbe|barbecue|grill))/) >= 0) {
        return exports.WARM_DRY;
    }
    if (action.search(/(beach|seaside|sea side|sea|sunbathe|sun bathe)/) >= 0) {
        return exports.WARM_DRY;
    }
    if (action.search(/(stay in|stay at home|duck|puddles|splash|rain|film|conference|cinema|show|theater|rain check|raincheck)/) >= 0) {
        return exports.WET;
    }
    return exports.UNKNOWN;
}