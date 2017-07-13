/**
 * Created by tom on 13/07/2017.
 */
var assert = require("assert");
var doT = require("dot");
var responses = require("../../main/resources/personas/default.json");
var weather = require("../resources/weather_model.json");

describe('test default persona responses', function () {

    var settings = doT.templateSettings;
    settings.strip = false;

    var model = {
        location: "Exeter",
        weather: weather
    };

    describe('weather', function () {

        it('detail[0].text[0]', function () {
            var expected = "In Exeter on average temperatures will be around 6°C reaching a high of 4°C. " +
                "Given the other conditions, this will feel like 1°C at its peak. " +
                "Northerly winds will reach a maximum of 13mph. " +
                "Visibility is expected to be very good at up to 40km. " +
                "There is a 7% chance of precipitation. ";
            var temp = responses.weather.detail[0].text[0];
            var dotTemp = doT.template(temp, settings);
            var actual = dotTemp(model);
            assert.equal(expected, actual);
        });

    });

});