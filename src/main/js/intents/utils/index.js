"use strict";

exports.storeAsPreviousIntent = (session) => {
    if (session.sessionState) {
        if (session.sessionState.callstack && session.sessionState.callstack.length >= 2) {
            var previousIntent = session.sessionState.callstack[1].id.substr(2);
            session.conversationData.previous_intent = previousIntent;
        }
        session.endDialog();
    }
};