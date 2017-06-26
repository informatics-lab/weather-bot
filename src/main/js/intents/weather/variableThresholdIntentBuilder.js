"use strict";

var winston = require("winston");
var utils = require("../utils");
var constants = require("../../constants");
var scoring = require("../../scoring");
var ua = require('universal-analytics');

/**
 * Module for building variable-threshold intents.
 *
 * A variable threshold intent returns a variable-certainty response.
 * Firstly the 'baseIntent' will be processed as identified by LUIS (weather.accessory|weather.variable).
 * The 'localIntent' and each of the 'synonyms' are preregistered as unique sub-routes.
 * The 'baseIntent' will route the request into the appropriate sub-route.
 * The weather is compared against each of the 'variableThresholds' passed in.
 * A certainty score is calculated for each with the MAX returned.
 * The certainty score is mapped to the variable-certainty response in the persona.
 *
 *
 * @param baseIntent - initial intent function to be executed
 * @param localIntent - generic name for unique intent sub-route
 * @param synonyms - Array<String> - list of synonyms for the localIntent
 * @param variableThresholds - Array<VariableThreshold> - list of variables with their associated thresholds specified
 */
module.exports = function (baseIntent, localIntent, synonyms, variableThresholds) {

    var self = this;
    self.baseIntent = baseIntent;
    self.localIntent = localIntent;
    self.primaryIntent = `${baseIntent}.${localIntent}`;
    self.synonyms = synonyms;
    self.variableThresholds = variableThresholds;

    function compare(variableThreshold, wxModel) {
        var score = scoring.getScoringFunction(variableThreshold.comparison);
        var value = eval("wxModel."+variableThreshold.variable);
        return score(variableThreshold.min, variableThreshold.optimal, variableThreshold.max, value);
    }

    return function (bot, persona) {
        self.synonyms.push(self.localIntent);
        self.synonyms.forEach((a) => {
            var currentIntent = `${self.baseIntent}.${a}`;
            bot.dialog(currentIntent, [
                (session, results, next) => {
                    var response = "";
                    var model = {user: session.userData};

                    //add location to response string
                    model["location"] = session.conversationData.location;

                    //loop over requested days
                    session.conversationData.time_target_dates.forEach((date) => {

                        var day = `${date.substr(0, 10)}Z`;
                        var wx = session.conversationData.forecast.SiteRep.DV.Location.Period.filter(f => day === f.value);
                        model["date"] = constants.DATE_TO_DATE_OBJECT(date);

                        if (wx && !(wx.length === 0)) {
                            wx = wx[0].Rep[0];
                            model = Object.assign(model, constants.DAILY_DATAPOINT_TO_MODEL(wx));

                            var scores = [];
                            self.variableThresholds.forEach((vtObj) => {
                                var score = compare(vtObj, model);
                                scores.push(score);
                            });

                            //TODO should we always be looking at the max score? possibly pass the appropriate function in
                            var finalScore = Math.max.apply(null, scores);

                            response += persona.getResponseForScore(self.primaryIntent, finalScore, model);

                        } else {
                            response += persona.getResponse("weather.no_data");
                        }
                    });

                    if (response && !(response === "")) {
                        ua(session.userData.ga_id, session.userData.uuid)
                            .event({ec: "intent", ea: currentIntent, el: session.message.text})
                            .send();
                        session.send(response);
                        return next({response: baseIntent});
                    } else {
                        session.send(persona.getResponse("error.general"));
                        return session.endDialog();
                    }
                }
            ]);
        });

    };
};
