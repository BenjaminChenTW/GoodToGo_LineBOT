var Message = require('./DB/messageDB.js');
var debug = require('debug')('goodtogo-linebot:chatroomHandler');

module.exports = {
    getFirst: function(next, callback) {
        Message.findOne({ 'event.message.type': 'text' }, {}, { sort: { 'event.timestamp': -1 } }, function(err, message) {
            if (err) return next(err);
            callback(message.event.source.userId);
        });
    },
    getMessage: function(id, next, callback) {
        Message.find({ 'event.message.type': 'text' }, function(err, messages) {
            messages.sort(function(a, b) { return b.event.timestamp - a.event.timestamp });
            if (err) return next(err);
            userMessages = [];
            otherMessages = [];
            for (var i = 0; i < messages.length; i++) {
                if (messages[i].event.source.userId === id) {
                    userMessages.push({
                        text: messages[i].event.message.text,
                        time: messages[i].event.timestamp
                    });
                } else {
                    if (checkExist(otherMessages, messages[i].event.source.userId)) break;
                    else {
                        otherMessages.push({
                            userId: messages[i].event.source.userId,
                            text: messages[i].event.message.text,
                            time: messages[i].event.timestamp
                        });
                    }
                }
            }
            callback({
                userMessages: userMessages,
                otherMessages: otherMessages
            });
        });
    }
};

function checkExist(list, targetID) {
    for (var i in list) {
        if (list[i].userId === targetID) {
            return true;
        }
    }
    return false;
};