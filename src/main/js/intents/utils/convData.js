var cache = require("js-cache");
var HOUR = 1000 * 60 * 60;
var MINUTE = 1000 * 60;
var DAY = HOUR * 24;

function getAll(session) {
    // Get the conversation data from the session. Creates empty if doesn't exist
    var data = session.conversationData;
    if (!data) {
        data = {};
        session.conversationData = data;
    }
    return data;
}

function addWithExpiry(session, key, data, ttl) {
    // Add data to session.convData data with key marking it as expiaring in ttl ms.
    // ttl defaults to 1 hours
    ttl = isNaN(ttl) ? HOUR : ttl;
    var expireAt = (new Date()).getTime() + ttl;
    getAll(session)[key] = {
        value: data,
        expireAt: expireAt
    }
}

function deleteItem(session, key) {
    delete getAll(session)[key];
}

function get(session, key) {
    // Gets the data if not expired. If expired or not found return undefined.
    var data = getAll(session)[key];
    if (!data) {
        return;
    }
    if (!data.expireAt) {
        return data; // If no expireAt then assume not managed using this util so just return as is.
    }
    if (data.expireAt === -1 || data.expireAt > (new Date()).getTime()) {
        return data.value;
    } else {
        delete getAll(session)[key];
    }
    return;
}

module.exports = {
    get: get,
    addWithExpiry: addWithExpiry,
    HOUR: HOUR,
    DAY: DAY,
    deleteItem: deleteItem
}