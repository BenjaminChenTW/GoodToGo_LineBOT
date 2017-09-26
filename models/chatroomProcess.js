var Message = require('./DB/messageDB.js');
var debug = require('debug')('goodtogo-linebot:chatroomHandler');

module.exports = {
    getFirst: function(next, callback) {
        Message.find({ 'event.message.type': 'text' }, function(err, messages) {
            if (err) return next(err);
            if (!messages || messages.length === 0) { return callback(true); }
            messages.sort(function(a, b) { return b.event.timestamp - a.event.timestamp });
            var roomList = [];
            for (var i = 0; i < messages.length; i++) {
                if (!checkExist(roomList, messages[i].event.source.userId)) {
                    roomList.push({
                        userId: messages[i].event.source.userId,
                        userName: messages[i].event.source.displayName || '無名稱',
                        userImg: messages[i].event.source.pictureUrl,
                        // text: messages[i].event.message.text,
                        // time: messages[i].event.timestamp,
                        hasRead: messages[i].read
                    });
                }
            }
            if (roomList.length === 0) { return callback(true); }
            callback(false, roomList);
        });
    },
    getMessage: function(id, next, callback) {
        Message.find({ 'event.message.type': 'text' }, function(err, messages) {
            if (err) return next(err);
            if (!messages || messages.length === 0) { return callback(true); }
            messages.sort(function(a, b) { return b.event.timestamp - a.event.timestamp });
            var userMessages = [];
            for (var i = 0; i < messages.length; i++) {
                if (messages[i].event.source.userId === id) {
                    userMessages.push({
                        type: 'customer',
                        text: messages[i].event.message.text,
                        time: messages[i].event.timestamp
                    });
                    messages[i].read = true;
                    messages[i].save((err) => debug(err));
                }
            }
            if (userMessages.length === 0) { return callback(true); }
            callback(false, userMessages);
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