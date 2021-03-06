var Message = require('./DB/messageDB.js');
var debug = require('debug')('goodtogo-linebot:chatroomHandler');

var textSendler = require('../models/messageProcess.js').textSendler;

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
        Message.find({ 'event.message.type': 'text', 'event.source.userId': id }, {}, { sort: { 'event.timestamp': 1 } }, function(err, messages) {
            if (err) return next(err);
            if (!messages || messages.length === 0) { return callback(true); }
            var userMessages = [];
            for (var i = 0; i < messages.length; i++) {
                if (messages[i].notify === true) {
                    startNotify = messages[i].event.timestamp;
                } else if (messages[i].notify === false) {
                    startNotify = 0;
                    if (userMessages.length !== 0 && messages[i - 1].notify === true)
                        userMessages.unshift({
                            type: 'system',
                            text: '-- 以上為上一對話階段 --'
                        });
                }
                if (messages[i].event.timestamp < getDate(startNotify, 3)) {
                    var type = '';
                    switch (messages[i].event.source.type) {
                        case 'user':
                            type = 'customer';
                            break;
                        case 'system':
                            type = 'system';
                            break;
                        default:
                            type = 'manager';
                            break;
                    }
                    userMessages.unshift({
                        type: type,
                        text: messages[i].event.message.text,
                        time: messages[i].event.timestamp
                    });
                }
            }
            if (userMessages.length === 0) { return callback(true, userMessages); }
            callback(false, userMessages);
        });
    },
    sendMessage: function(id, text, next, callback) {
        Message.find({ 'event.message.type': 'text', 'event.source.userId': id }, 'event.source notify read', { sort: { 'event.timestamp': -1 } }, function(err, messages) {
            if (messages[0].notify === true) {
                message = new Message();
                message.event = {
                    message: {
                        text: text,
                        type: 'text'
                    },
                    timestamp: Date.now(),
                    source: {
                        userId: id
                    }
                };
                message.notify = true;
                message.read = true;
                message.event.source['displayName'] = messages[0].event.source.displayName;
                message.event.source['pictureUrl'] = messages[0].event.source.pictureUrl;
                message.save((err) => {
                    if (err) return next(err);
                    textSendler(id, text, callback, messages[0].event.source.displayName, messages[0].event.source.pictureUrl);
                });
                for (var i = 0; i < messages.length; i++) {
                    if (!messages[i].read) {
                        messages[i].read = true;
                        messages[i].save((err) => { if (err) debug(err) });
                    }
                }
            } else {
                callback({}, {}, { text: '對話階段尚未開啟。' });
            }
        });
    },
    getImg: function(id, next, callback) {
        Message.findOne({ 'img.id': id }, 'img.checked img.checkStatus logTime', function(err, img) {
            if (!img) return callback({});
            callback({
                src: '/getImg/' + id,
                imgIndex: id,
                uploadTime: img.logTime,
                checked: img.img.checked,
                checkStatus: img.img.checkStatus
            });
        });
    },
    stopSession: function(id, next, callback) {
        Message.find({ 'event.message.type': 'text', 'event.source.userId': id }, 'event.source notify read', { sort: { 'event.timestamp': -1 } }, function(err, messages) {
            if (messages[0].notify === true) {
                terminateText = '謝謝您聯繫我們，希望您的問題都有被解決！如還有需要與專人聯繫，請再次點選「聯絡客服」';
                message = new Message();
                message.event = {
                    message: {
                        text: terminateText,
                        type: 'text'
                    },
                    timestamp: Date.now(),
                    source: {
                        userId: id
                    }
                };
                message.notify = false;
                message.read = true;
                message.event.source['displayName'] = messages[0].event.source.displayName;
                message.event.source['pictureUrl'] = messages[0].event.source.pictureUrl;
                message.save((err) => {
                    if (err) return next(err);
                    textSendler(id, terminateText, callback, true);
                });
                for (var i = 0; i < messages.length; i++) {
                    if (!messages[i].read) {
                        messages[i].read = true;
                        messages[i].save((err) => { if (err) debug(err) });
                    }
                }
            } else {
                callback(false);
            }
        });
    },
    checkUnRead: function(callback) {
        Message.count({ 'event.message.type': 'text', 'read': false }, function(err, unreadAmount) {
            if (unreadAmount > 0) return callback(true);
            return callback(false);
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