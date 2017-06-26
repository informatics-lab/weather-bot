"use strict";

var winston = require("winston");
var request = require("request");

/**
 * Module makes HTTP requests
 */
module.exports = {

    /**
     * Performs HTTP GET on given URI.
     *
     * @param uri - uri to GET
     * @returns {Promise} resolved with JSON response if successful.
     */
    getAsJson: (uri) => {
        return new Promise((resolve, reject) => {
            var options = {
                uri: uri,
                method: "GET"
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