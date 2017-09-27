var Message = require('./DB/messageDB.js');
var debug = require('debug')('goodtogo-linebot:chatroomHandler');

function getDate(time, int) {
    var date = new Date(time)
    date = date.setDate(date.getDate() + int);
    return date;
}

module.exports = {
    getFirst: function(next, callback) {
        Message.find({ 'event.message.type': 'text' }, {}, { sort: { 'event.timestamp': -1 } }, function(err, messages) {
            if (err) return next(err);
            if (!messages || messages.length === 0) { return callback(true); }
            var roomList = [];
            for (var i = 0; i < messages.length; i++) {
                for (var j = i; j < messages.length; j++) {
                    if (messages[j].notify === true) {
                        if (!checkExist(roomList, messages[i].event.source.userId)) {
                            roomList.push({
                                userId: messages[i].event.source.userId,
                                userName: messages[i].event.source.displayName || '無名稱',
                                userImg: messages[i].event.source.pictureUrl,
                                text: messages[i].event.message.text,
                                time: messages[i].event.timestamp,
                                hasRead: messages[i].read
                            });
                        }
                    }
                    break;
                }
            }
            if (roomList.length === 0) { return callback(true); }
            callback(false, roomList);
        });
    },
    getMessage: function(id, next, callback) {
        var startNotify = 0;
        Message.find({ 'event.message.type': 'text' }, {}, { sort: { 'event.timestamp': 1 } }, function(err, messages) {
            if (err) return next(err);
            if (!messages || messages.length === 0) { return callback(true); }
            var userMessages = [];
            for (var i = 0; i < messages.length; i++) {
                if (messages[i].event.source.userId === id) {
                    if (messages[i].notify === true) {
                        startNotify = messages[i].event.timestamp;
                    } else if (messages[i].notify === false) {
                        startNotify = 0;
                        if (userMessages.length !== 0)
                            userMessages.unshift({
                                type: 'system',
                                text: '-- 以上為上一對話階段 --'
                            });
                    } else if (messages[i].event.timestamp < getDate(startNotify, 3)) {
                        userMessages.unshift({
                            type: ((messages[i].event.source.type) ? 'customer' : 'manager'),
                            text: messages[i].event.message.text,
                            time: messages[i].event.timestamp
                        });
                        messages[i].read = true;
                        messages[i].save((err) => { if (err) debug(err) });
                    }
                }
            }
            if (userMessages.length === 0) { return callback(true, userMessages); }
            callback(false, userMessages);
        });
    },
    sendMessage: function(id, text, next, callback) {
        message = new Message();
        message.event = {
            message: {
                text: text,
                type: 'text'
            },
            timestamp: Date.now()
        };
        message.save((err) => {
            if (err) next(err);
            callback();
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