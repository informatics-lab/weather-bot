"use strict";

var convData = require("./convData");

exports.storeAsPreviousIntent = (session, results) => {
    if (results && results.response && typeof(results.response) === 'string') {
        convData.addWithExpiry(session, "previous_intent", results.response, convData.MINUTE * 3);
    }
    session.endDialog();
};

exports.sanitze = require('./sanitze');

exports.summarize = require('./summarize');

exports.capture = require('./capture');

exports.convData = convData;

exports.time = require('./timeUtils');