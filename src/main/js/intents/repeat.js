"use strict";

var winston = require("winston");
var utils = require("./utils");
var convData = utils.convData;


//TODO: not really a weather specific intent possibly move
module.exports = function(bot, persona, datapoint, gmaps) {

    var intent = "repeat";

    bot.dialog(intent, [
        (session, results, next) => {
            winston.info("[ %s ] intent matched [ %s ]", intent, session.message.text);
            var previous = convData.get(session, "previous_intent");
            if (previous) {
                //should have at least 1 new entity.
                if(results.entities && results.entities.length > 0){
                    session.conversationData.luis = results;
                    return next();
                } else {
                    convData.deleteItem(session, "isRepeat");
                    session.send(persona.getResponse("error.repeat.entity"));
                    return session.endDialog();
                }
            } else {
                convData.deleteItem(session, "isRepeat");
                session.send(persona.getResponse("error.nonsense"));
                return session.endDialog();
            }
        },
        utils.capture.datetimeV2,
        utils.sanitze.datetimeV2,

        utils.capture.location,
        utils.sanitze.location,

        (session, results, next) => {
            gmaps.geocode(utils.convData.get(session, 'location'))
                .then((res) => {
                    session.conversationData.gmaps = res;
                    return next();
                })
                .catch((err) => {
                    winston.warn(err);
                    session.send(persona.getResponse("error.location.not_uk"));
                    return session.endDialog();
                });
        },
        (session, results, next) => {
            var range = utils.convData.get(session, 'time_target').range;
            range = utils.time.rangeStrsToObjs(range);
            var end = range.toDT;
            datapoint.getMethodForTargetTime(end)(session.conversationData.gmaps.results[0].geometry.location.lat, session.conversationData.gmaps.results[0].geometry.location.lng)
                .then((res) => {
                    session.conversationData.datapoint = res;
                    return next();
                })
                .catch((err) => {
                    winston.warn(err);
                    if (err && err.response_id) {
                        session.send(persona.getResponse(err.response_id));
                    } else {
                        session.send(persona.getResponse("error.data.not_returned"));
                    }
                    return session.endDialog();
                })
        },
        utils.sanitze.weather,
        utils.summarize.weather,


        (session, results, next) => {
            var previous = convData.get(session, "previous_intent");
            convData.addWithExpiry(session, "isRepeat", true, convData.MINUTE * 3);
            return session.beginDialog(previous, session.conversationData.luis);
        },
        (session, results, next) => {
            convData.deleteItem(session, "isRepeat");
            session.endDialog();
        }
    ]);

};