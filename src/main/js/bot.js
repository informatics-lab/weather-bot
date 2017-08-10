"use strict";

var builder = require("botbuilder");
var winston = require("winston");
var debugTools = require('./debugTools');
var convData = require('./intents/utils').convData;

function buildBot(luis, connector, config, persona, datapoint, gmaps, ua) {
    winston.info("starting %s %s", config.app.name, config.app.version);

    var bot = new builder.UniversalBot(connector, { persistConversationData: true });

    var intents = require("./intents");
    var prompt = require("./prompt");


    //conversation root
    bot.dialog("/", [
        (session) => {
            if (config.get("DEBUG_TOOLS") && debugTools(session)) {
                return;
            }
            if (!session.userData.uuid) {
                if (session.message.address.channelId === "facebook") {
                    session.userData["channel"] = "fb";
                    session.userData["name"] = session.message.address.user.name.split(" ")[0];
                    session.userData["fb"] = session.message.address.user;
                }
                session.userData["ga_id"] = config.get("GOOGLE_ANALYTICS_ID");
                session.userData["uuid"] = ua(session.userData.ga_id).cid;
            }
            if (!session.message.text || session.message.text.trim() === "") {
                // no content in message from user - probably a 'like' or 'sticker'
                if (!session.userData.greeted) {
                    // user may have initialised conversation with a like or sticker.
                    session.beginDialog("smalltalk.greeting");
                } else {
                    session.send(persona.getResponse("error.nonsense"));
                    session.endDialog();
                }
            } else {
                luis.parse(session.message.text)
                    .then((response) => {
                        if (response.topScoringIntent.score >= 0.1) {
                            convData.deleteItem(session, 'isRepeat'); // delete the repeate flag. It will be added by the repeate intent if is repeat.
                            session.beginDialog(response.topScoringIntent.intent.toLowerCase(), response);
                        } else {
                            if (!session.userData.greeted) {
                                session.beginDialog("smalltalk.greeting");
                            } else {
                                session.beginDialog("none");
                            }
                        }
                    })
                    .catch((err) => {
                        winston.error("%s", err);
                        session.send(persona.getResponse("error.general"));
                        session.endDialog();
                    });
            }
        }
    ]);

    // add the intents
    intents.none(bot, persona);
    intents.help(bot, persona);
    intents.repeat(bot, persona);

    intents.met_office.general_information(bot, persona);

    // weather
    intents.weather(bot, persona, datapoint, gmaps);

    // smalltalk
    intents.smalltalk.greeting(bot, persona, config.get("LOGO_URL"));
    intents.smalltalk.farewell(bot, persona);

    intents.smalltalk.bot.are_you_a_chatbot(bot, persona);
    intents.smalltalk.bot.are_you_busy(bot, persona);
    intents.smalltalk.bot.are_you_hungry(bot, persona);
    intents.smalltalk.bot.are_you_ok(bot, persona);
    intents.smalltalk.bot.are_you_real(bot, persona);
    intents.smalltalk.bot.family_status(bot, persona);
    intents.smalltalk.bot.how_old_are_you(bot, persona);
    intents.smalltalk.bot.name(bot, persona);
    intents.smalltalk.bot.relationship_status(bot, persona);
    intents.smalltalk.bot.what_is_your_salary(bot, persona);
    intents.smalltalk.bot.when_is_your_birthday(bot, persona);
    intents.smalltalk.bot.where_are_you_from(bot, persona);
    intents.smalltalk.bot.where_do_you_work(bot, persona);
    intents.smalltalk.bot.who_are_you(bot, persona);
    intents.smalltalk.bot.would_you_like_to_be_human(bot, persona);
    intents.smalltalk.bot.how_are_you(bot, persona);

    intents.smalltalk.courtesy.good(bot, persona);
    intents.smalltalk.courtesy.no(bot, persona);
    intents.smalltalk.courtesy.no_problem(bot, persona);
    intents.smalltalk.courtesy.okay(bot, persona);
    intents.smalltalk.courtesy.please(bot, persona);
    intents.smalltalk.courtesy.sorry(bot, persona);
    intents.smalltalk.courtesy.thank_you(bot, persona);
    intents.smalltalk.courtesy.well_done(bot, persona);
    intents.smalltalk.courtesy.yes(bot, persona);
    intents.smalltalk.courtesy.you_are_welcome(bot, persona);

    intents.smalltalk.user.bored(bot, persona);
    intents.smalltalk.user.happy(bot, persona);
    intents.smalltalk.user.robot(bot, persona);
    intents.smalltalk.user.sad(bot, persona);
    intents.smalltalk.user.tired(bot, persona);

    intents.smalltalk.emotions.boo(bot, persona);
    intents.smalltalk.emotions.cool(bot, persona);
    intents.smalltalk.emotions.ha_ha(bot, persona);
    intents.smalltalk.emotions.la_la(bot, persona);
    intents.smalltalk.emotions.wow(bot, persona);

    // user
    intents.user.name(bot, persona);

    // prompt
    prompt(bot, persona);

    return bot;
}


module.exports = buildBot;