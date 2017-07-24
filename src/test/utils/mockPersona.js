var persona = require(`../../main/js/persona`);

var defaults = {
    "smalltalk": {
        "greeting": [
            "Hello{{? it.user.name}} {{= it.user.name}}{{?}}"
        ]
    },
    "help": ["help text..."],
    "user": { "name": ["Ok {{= it.user.name}}"] },
    "prompts": { "user": { "name": ["What is you name?"] } },
    "error": { "general": ["there was an error"] }
};

module.exports = responces => persona(Object.assign(defaults, responces || {}));