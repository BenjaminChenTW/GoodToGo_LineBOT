var Message = require('./DB/messageDB.js');

function getListObj(ori) {
    return {
        indexId: ori.img.id,
        userId: ori.event.source.userId,
        userName: ori.event.source.displayName,
        uploadTime: ori.event.timestamp,
        messageId: ori.event.message.id,
        imgType: ori.img.contentType,
        imgBinary: ori.img.data.toString('base64'),
        checked: ori.img.checked
    };
}

module.exports = {
    getInitList: function(getList, next, callback) {
        Message.find({ 'event.message.type': 'image' }, function(err, messages) {
            if (err) next(err);
            messages.sort(function(a, b) { return a.img.id - b.img.id });
            if (messages.length === 0) return callback(0, []);
            var index = -1;
            for (var i = 0; i < messages.length; i++) {
                if (messages[i].img.checked === false) {
                    index = i;
                    break;
                }
            }
            if (index === -1) {
                for (var i = messages.length; i > (messages.length - 20) && i >= 0; i--) {
                    list.unshift(getListObj(messages[i]));
                }
                return callback(messages.length, list);
            }
            getList(index, function(list) {
                if (list.length < 20 && index !== 0) {
                    for (var i = index - 1; i < (20 - list.length) && i >= 0; i--) {
                        list.unshift(getListObj(messages[i]));
                    }
                }
                return callback(list[list.length - 1].indexId, list);
            });
        });
    },
    getImageList: function(index, next, callback) {
        Message.find({ 'event.message.type': 'image' }, function(err, messages) {
            if (err) next(err);
            messages.sort(function(a, b) { return a.img.id - b.img.id });
            var list = [];
            var listLength = 20;
            if (index > messages.length) return callback([]);
            else if (index > (messages.length - 20)) listLength = (messages.length - index);
            for (var i = 0; i < listLength; i++, index++) {
                if (index < messages.length) {
                    list.push(getListObj(messages[index]));
                }
            }
            callback(list);
        });
    }
}