module.exports = (bot, persona, datapoint, gmaps) => {
    require("./action")(bot, persona, datapoint, gmaps);
    require("./actions")(bot, persona);
    require("./unknownAction")(bot, persona);
}