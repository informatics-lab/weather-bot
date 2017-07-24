"use strict";

module.exports = (bot, persona, datapoint, gmaps) => {
    require("./forecast")(bot, persona, datapoint, gmaps)
    require("./detail")(bot, persona);

    require("./accessory")(bot, persona, datapoint, gmaps);
    require("./accessories")(bot, persona)

    require("./action")(bot, persona, datapoint, gmaps);

    require("./variable")(bot, persona, datapoint, gmaps);
    require("./variables")(bot, persona);
}