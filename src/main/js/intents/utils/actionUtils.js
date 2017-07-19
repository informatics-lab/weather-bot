"use strict";

exports.DRY = 'dry';
exports.WARM_DRY = 'warm_dry';
exports.WARM_SUNNY_DRY = 'warm_suny_dry';
exports.LAUNDRY = 'laundry';
exports.UNKNOWN = 'unknown';

exports.action_type = function(action) {
    action = action.toLowerCase();
    if (action.search(/(do|the|hang|out|dry).*(wash|laundry)/) >= 0) {
        return exports.LAUNDRY;
    }
    if (action.search(/(walk|hike|bike|cycle)/) >= 0) {
        return exports.DRY;
    }
    if (action.search(/((eat.*(out|alfresco))|(bbq|barby|barbe|barbecue|grill))/) >= 0) {
        return exports.WARM_DRY;
    }
    if (action.search(/(beach|seaside|sea side|sea|sunbathe|sun bathe)/) >= 0) {
        return exports.WARM_SUNNY_DRY;
    }
    return exports.UNKNOWN;
}