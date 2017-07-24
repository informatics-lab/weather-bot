"use strict"

module.exports = (session) => {
    if (session.message.text === "/dAllData") {
        session.userData = {};
        session.conversationData = {};
        session.send("all data deleted");
        return true;
    }
    if (session.message.text === "/dConversationData") {
        session.conversationData = {};
        session.send("conversation data deleted");
        return true;
    }
    if (session.message.text === "/sConversationData") {
        console.log(session.conversationData);
        session.send(JSON.stringify(session.conversationData));
        return true;
    }
    if (session.message.text === "/dUserData") {
        session.userData = {};
        session.send("user data deleted");
        return true;
    }
    if (session.message.text === "/sUserData") {
        console.log(session.userData);
        session.send(JSON.stringify(session.userData));
        return true;
    }
    return false;
}