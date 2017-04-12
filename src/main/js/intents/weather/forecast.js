"use strict";

var winston = require("winston");

module.exports = (bot, persona, datapoint) => {

    var intent = "weather.forecast";

    bot.dialog(intent, [
        (session, results, next) => {
            winston.debug("[ %s ] intent matched [ %s ]", intent, session.message.text);
            // if (results.entities && results.entities.length > 0) {
            //
            // }
            // if (!session.userData.location) {
            //     session.beginDialog("dialogs.user.location");
            // } else {
            //     next();
            // }
            next();
        },
        (session, results) => {
            //to do query datapoint
            winston.debug("stuff with datapoint");
            datapoint.getNearestSiteToLatLng({lat: 50, lng: -3})
                .then((res) => {
                    session.send(JSON.stringify(res));
                    return datapoint.getDailyDataForSiteId(res.location.id);
                })
                .then((res)=>{
                    session.send(JSON.stringify(res));
                    session.endDialog();
                });
        }
    ]);

};