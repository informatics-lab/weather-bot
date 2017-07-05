"use strict";

var winston = require("winston");
var request = require("request");

module.exports = {
    getAsJson: (uri, headers) => {
        return new Promise((resolve, reject) => {
            var options = {
                uri: uri,
                method: "GET",
                headers: headers
            };
            request(options, (err, response, body) => {
                if (!err && response.statusCode.toString().startsWith("2")) {
                    resolve(JSON.parse(body));
                } else {
                    winston.error("error getting uri [%s] \n %s", uri, err);
                    reject(err);
                }
            });
        });
    }
};
