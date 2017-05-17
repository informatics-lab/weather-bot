"use strict";

var winston = require("winston");
var utils = require("../utils");
var constants = require("../../constants");
var doT = require("dot");
var scoring = require("../../scoring");
var ua = require('universal-analytics');

module.exports = function (baseIntent, accessory, synonyms, variableThresholds) {

    var self = this;
    self.baseIntent = baseIntent;
    self.accessory = accessory;
    self.primaryIntent = `${baseIntent}.${accessory}`;
    self.synonyms = synonyms;
    self.variableThresholds = variableThresholds;

    function compare(variableThreshold, wxModel) {
        var score = scoring.getScoringFunction(variableThreshold.comparison);
        return score(variableThreshold.min, variableThreshold.optimal, variableThreshold.max, wxModel[variableThreshold.variable]);
    }

    return function (bot, persona) {
        self.synonyms.push(self.accessory);
        self.synonyms.forEach((a) => {
            var currentIntent = `${self.baseIntent}.${a}`;
            bot.dialog(currentIntent, [
                (session, results, next) => {
                    var response;
                    var model = {};
                    model.location = session.conversationData.location;
                    session.conversationData.time_target_dates.forEach((date) => {

                        var day = `${date.substr(0, 10)}Z`;
                        var wx = session.conversationData.forecast.SiteRep.DV.Location.Period.filter(f => day === f.value);

                        model = Object.assign(model, constants.DATE_TO_DATE_OBJECT(date));

                        if (wx && !(wx.length === 0)) {
                            wx = wx[0].Rep[0];

                            model = Object.assign(model, constants.DAILY_DATAPOINT_TO_MODEL(wx));

                            var total = 0.0;
                            self.variableThresholds.some((vtObj) => {

                                var score = compare(vtObj, model);
                                if (score === 1.0) {
                                    total = 1.0;
                                    return true;
                                } else {
                                    total = total + (score / self.variableThresholds.length);
                                }
                            });

                            var template = doT.template(persona.getResponseForScore(self.primaryIntent, total));
                            response = template({model: model});

                        } else {
                            response = persona.getResponse("weather.no_data");
                        }

                        ua(session.userData.ga_id, session.userData.uuid)
                            .event({ec: "intent", ea: currentIntent, el: session.message.text})
                            .send();
                        session.send(response);
                        return next({response: "weather.accessory"});
                    });

                }
            ]);
        });

    };
};
