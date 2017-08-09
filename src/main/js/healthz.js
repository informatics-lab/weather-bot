"use strict";

var winston = require("winston");

module.exports = (req, res, next) => {
    res.send('success');
    winston.debug("Health endpoint called");
    next();
};
