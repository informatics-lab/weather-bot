"use strict";

var sugar = require("sugar");
var winston = require("winston");
var math = require("mathjs");
var constants = require("../../constants");
var actionUtils = require('./actionUtils');

exports.storeAsPreviousIntent = (session, results) => {
    if (results && results.response) {
        session.conversationData.previous_intent = results.response;
    }
    session.endDialog();
};

exports.sanitze = require('./sanitze');

exports.summarize = require('./summarize');

exports.capture = require('./capture');