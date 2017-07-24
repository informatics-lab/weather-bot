const mocha = require('mocha');
const builder = require('botbuilder');
const { testSuiteBuilder, execute } = require('bot-tester');
const { expect } = require('chai');
const sinon = require('sinon');
const buildBot = require("../../main/js/bot");

const botRequirements = require('../utils/botRequirements');

let replies = {
    "weather": {
        "forecast": [
            "{{= it.location}} {{? it.weather.temperature.feels_like.mean<=7}}looks like it will be pretty cold{{?? it.weather.temperature.feels_like.mean<=12}}will be reasonably mild{{?? it.weather.temperature.feels_like.mean>12}}is looking hot!{{??}}{{?}}"
        ]
    }
}

describe('Gets weather data correctly', () => {
    let bot;
    let clock;
    let requestedLatLon;

    beforeEach(() => {

        requestedLatLon = null;
        var {
            luis,
            connector,
            config,
            persona,
            datapoint,
            gmaps,
            ua
        } = botRequirements(false, 'warn');

        persona = require(`../utils/mockPersona`)(replies);

        function mockDataAPI(lat, lon) {
            requestedLatLon = [lat, lon];
            return Promise.resolve(require('../resources/datapoint.json'));
        }

        datapoint = {
            getMethodForTargetTime: () => mockDataAPI
        };

        bot = buildBot(luis, connector, config, persona, datapoint, gmaps, ua);

    });

    it('Replys with the weather for location', () => {

        const {
            executeDialogTest,
            SendMessageToBotDialogStep,
        } = testSuiteBuilder(bot);

        return executeDialogTest([
            // Get saying hellow and greeting out the way.
            new SendMessageToBotDialogStep('Hello!'),
            new SendMessageToBotDialogStep('Theo'),
            // TODO: rather the specify the date mock the data out to current date?
            new SendMessageToBotDialogStep('What is the weather in exeter on 20/07/17', ["Exeter is looking hot!"])
        ])
    });


    it('Gets correct lat lon', () => {

        const {
            executeDialogTest,
            SendMessageToBotDialogStep,
        } = testSuiteBuilder(bot);

        return executeDialogTest([
            // Get saying hellow and greeting out the way.
            new SendMessageToBotDialogStep('Hello!'),
            new SendMessageToBotDialogStep('Theo'),
            // TODO: rather the specify the date mock the data out to current date?
            new SendMessageToBotDialogStep('Give me the forecast for Exeter'),
            {
                execute: () => new Promise((res, rej) => {
                    let [lat, lon] = requestedLatLon;
                    if (!(lon > -3.54 && lon < -3.52 && lat < 50.72 && lat > 50.70)) {
                        rej(new Error(`Lat and long not correct for exeter: ${lat}, ${lon}`));
                    } else {
                        res();
                    }
                })
            }
        ]);

    });
});