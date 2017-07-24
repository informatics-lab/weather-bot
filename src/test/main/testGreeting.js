const mocha = require('mocha');
const builder = require('botbuilder');
const { testSuiteBuilder } = require('bot-tester');
const { expect } = require('chai');

const buildBot = require("../../main/js/bot");

const botRequirements = require('../utils/botRequirements');

let replies = {
    "smalltalk": {
        "greeting": [
            "Hello to you"
        ]
    },
    "help": ["This is the help text"],
    "user": { "name": ["nice to meet you {{= it.user.name}}."] },
    "prompts": { "user": { "name": ["What is your name"] } }
}

describe('Greets appropiatly', () => {
    let bot;

    beforeEach(() => {
        var {
            luis,
            connector,
            config,
            persona,
            datapoint,
            gmaps,
            ua
        } = botRequirements();

        var persona = require(`../utils/mockPersona`)(replies);

        bot = buildBot(luis, connector, config, persona, datapoint, gmaps, ua);

    });

    it('Replys with a greeting, help, and asks for a name', () => {

        const {
            executeDialogTest,
            SendMessageToBotDialogStep,
        } = testSuiteBuilder(bot);

        return executeDialogTest([
            new SendMessageToBotDialogStep('Hello!', [
                replies.smalltalk.greeting[0],
                replies.help[0],
                replies.prompts.user.name[0]
            ])
        ])
    });

    it('It greets by name once known', () => {

        const {
            executeDialogTest,
            SendMessageToBotDialogStep,
        } = testSuiteBuilder(bot);

        const name = 'Theo';

        return executeDialogTest([
            new SendMessageToBotDialogStep('Hello!'),
            new SendMessageToBotDialogStep(name, [
                replies.user.name[0].replace("{{= it.user.name}}", name)
            ])
        ])
    });






});