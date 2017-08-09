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
 * @param scoreAggregator - String - one of `min`, `max`, `mean` or `product`. Mode for combining the scores from the different variables. Defaults to `mean`
 */
module.exports = function(baseIntent, localIntent, synonyms, variableThresholds, scoreAggregator) {

    var self = this;
    self.baseIntent = baseIntent;
    self.localIntent = localIntent;
    self.primaryIntent = `${baseIntent}.${localIntent}`;
    self.synonyms = synonyms;
    self.variableThresholds = variableThresholds;
    scoreAggregator = scoreAggregator || 'mean';
    self.scoreAggregator = scoring.getAggregator(scoreAggregator);

    function compare(variableThreshold, wxModel) {
        var score = scoring.getScoringFunction(variableThreshold.comparison);
        var value = eval("wxModel." + variableThreshold.variable); // TODO: Replace eval with somehting safer? - https://stackoverflow.com/questions/6491463/accessing-nested-javascript-objects-with-string-key/22129960#22129960
        return score(variableThreshold.min, variableThreshold.optimal, variableThreshold.max, value);
    }

    return function(bot, persona) {
        self.synonyms.push(self.localIntent);
        self.synonyms.forEach((a) => {
            var currentIntent = `${self.baseIntent}.${a}`;
            bot.dialog(currentIntent, [
                (session, results, next) => {

                    ua(session.userData.ga_id, session.userData.uuid)
                        .event({ ec: "intent", ea: currentIntent, el: session.message.text })
                        .send();

                    var response = "";
                    var model = {
                        user: session.userData,
                        location: utils.convData.get(session, 'location'),
                        date: {
                            day_string: utils.convData.get(session, 'time_target').text
                        }
                    };

                    if (!session.conversationData.weather) {
                        session.send(persona.getResponse("weather.no_data"));
                        return next({ response: baseIntent });
                    }

                    model.weather = session.conversationData.weather;

                    var scores = [];
                    self.variableThresholds.forEach((vtObj) => {
                        var score = compare(vtObj, model.weather);
                        scores.push(score);
                    });


                    var finalScore = self.scoreAggregator(scores);

                    response = response + persona.getResponseForScore(self.primaryIntent, finalScore, model);

                    if (response && !(response === "")) {
                        session.send(response);
                        return next({ response: baseIntent });
                    } else {
                        session.send(persona.getResponse("error.general"));
                        return session.endDialog();
                    }
                }
            ]);
        });

    };
};