"use strict";

var winston = require("winston");
var request = require("request");

module.exports = {
    getAsJson: (uri) => {
        return new Promise((resolve, reject) => {
            var options = {
                uri: uri,
                method: 'GET'
            };
            request(options, (err, response, body) => {
                if (!err) {
                    resolve(JSON.parse(body));
                } else {
                    winston.error("error getting uri [%s] \n %s", uri, err);
                    reject(err);
                }
            });
        });
    }
};