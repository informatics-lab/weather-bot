"use strict";

var winston = require("winston");
var utils = require("../utils");
var constants = require("../../constants");
var doT = require("dot");


module.exports = function (intent, variableThresholds) {

    var self = this;
    self.variableThresholds = variableThresholds;
    self.intent = intent;

    var greaterThan = function (a, b) {
        return a > b;
    };

    var lessThan = function (a, b) {
        return a < b;
    };

    var getComparasionFunction = function (str) {
        switch (str) {
            case "GT" :
                return greaterThan;
            case "LT" :
                return lessThan;
            default:
                return null;
        }
    };

    var compare = function (variableThreshold, wxModel) {
        var comparison = getComparasionFunction(variableThreshold.comparison);
        return comparison(wxModel[variableThreshold.variable], variableThreshold.value);
    };

    return function (bot, persona) {
        bot.dialog(self.intent, [
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

                        var accessoryIsNeeded = false;
                        self.variableThresholds.forEach((vtObj) => {
                            if (compare(vtObj, model)) {
                                accessoryIsNeeded = true;
                            }
                        });

                        if (accessoryIsNeeded) {
                            var template = doT.template(persona.getResponse(`${self.intent}.yes`));
                            response = template({model: model});
                        } else {
                            var template = doT.template(persona.getResponse(`${self.intent}.no`));
                            response = template({model: model});
                        }

                    } else {
                        response = persona.getResponse("weather.no_data");
                    }

                    session.send(response);
                    return next({response: "weather.accessory"});
                });

            }
        ])
    };
};