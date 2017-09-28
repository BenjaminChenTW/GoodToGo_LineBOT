var Message = require('./DB/messageDB.js');

function getListObj(ori) {
    return {
        indexId: ori.img.id,
        userId: ori.event.source.userId,
        userName: ori.event.source.displayName,
        uploadTime: ori.event.timestamp,
        imgType: ori.img.contentType,
        imgBinary: ori.img.data.toString('base64'),
        checked: ori.img.checked,
        checkedStatus: ori.img.checkStatus
    };
}

module.exports = {
    getInitIndex: function(next, callback) {
        Message.findOne({ 'event.message.type': 'image', 'img.checked': false }, 'img.id', { sort: { 'img.id': 1 } }, function(err, message) {
            if (err) next(err);
            if (!message) {
                Message.count({ 'event.message.type': 'image' }, function(err, amount) {
                    return callback(amount - 1);
                });
            } else {
                callback(message.img.id);
            }
        });
    },
    getInitList: function(index, next, callback) {
        index = parseInt(index);
        var returnList = [];
        Message.find({ 'event.message.type': 'image', 'img.checked': false, 'img.id': { '$gte': index, '$lt': index + 20 } }, {}, { sort: { 'img.id': 1 } }, function(err, messages) {
            if (err) next(err);
            if (messages.length < 20) {
                Message.find({ 'event.message.type': 'image', 'img.checked': false, 'img.id': { '$gte': index - (20 - messages.length), '$lt': index } }, {}, { sort: { 'img.id': 1 } }, function(err, messagesFront) {
                    if (err) next(err);
                    messages = messagesFront.concat(messages);
                    for (var i = 0; i < messages.length; i++) {
                        returnList.push(getListObj(messages[i]));
                    }
                    return callback(returnList);
                });
            } else {
                for (var i = 0; i < messages.length; i++) {
                    returnList.push(getListObj(messages[i]));
                }
                return callback(returnList);
            }
        });
    },
    getImageList: function(index, next, callback) {
        index = parseInt(index);
        if (index <= 0) callback([]);
        Message.find({ 'event.message.type': 'image', 'img.checked': false, 'img.id': { '$gte': index, '$lt': index + 20 } }, {}, { sort: { 'img.id': 1 } }, function(err, messages) {
            if (err) next(err);
            if (!messages) return callback([]);
            var list = [];
            for (var i = 0; i < messages.length; i++) {
                list.push(getListObj(messages[i]));
            }
            callback(list);
        });
    },
    getImageListBackward: function(index, next, callback) {
        index = parseInt(index);
        if (index <= 0) callback([]);
        Message.find({ 'event.message.type': 'image', 'img.id': { '$gt': index - 20, '$lte': index } }, {}, { sort: { 'img.id': 1 } }, function(err, messages) {
            if (err) next(err);
            if (!messages) return callback([]);
            var list = [];
            for (var i = 0; i < messages.length; i++) {
                list.push(getListObj(messages[i]));
            }
            callback(list);
        });
    }
}