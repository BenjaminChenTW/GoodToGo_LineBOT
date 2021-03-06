var Message = require('./DB/messageDB.js');

function getListObj(ori) {
    return {
        indexId: ori.img.id,
        userId: ori.event.source.userId,
        userName: ori.event.source.displayName,
        uploadTime: ori.event.timestamp,
        checked: ori.img.checked,
        checkedStatus: ori.img.checkStatus,
        ignoreButton: ori.notify
    };
}

module.exports = {
    getInitIndex: function(next, callback) {
        Message.findOne({ 'event.message.type': 'image', 'img.checked': false }, 'img.id', { sort: { 'img.id': 1 } }, function(err, message) {
            if (err) return next(err);
            if (!message) {
                Message.count({ 'event.message.type': 'image' }, function(err, amount) {
                    return callback(amount - 1);
                });
            } else {
                callback(message.img.id);
            }
        });
    },
    getImageList: function(index, checked, next, callback) {
        index = parseInt(index);
        var query = {};
        if (index === -245) {
            query = { 'event.message.type': 'image', 'img.checked': checked, 'read': false };
        } else if (index < 0) {
            return callback([]);
        } else {
            query = { 'event.message.type': 'image', 'img.checked': checked, 'read': false, 'img.id': { '$gte': index } };
        }
        Message.find(query, 'img.checkStatus img.checked img.id event notify', function(err, messages) {
            if (err) return next(err);
            if (!messages) return callback([]);
            messages.sort(function(a, b) { return a.img.id - b.img.id });
            var list = [];
            for (var i = 0; i < messages.length; i++) {
                list.push(getListObj(messages[i]));
            }
            callback(list);
        });
    },
    checkUnckecked: function(callback) {
        Message.count({ 'event.message.type': 'image', 'img.checked': false, 'read': false }, function(err, uncheckedAmount) {
            if (uncheckedAmount > 0) return callback(true);
            return callback(false);
        });
    }
};