var Message = require('./DB/messageDB.js');
var debug = require('debug')('goodtogo-linebot:usageProcess');

module.exports = function(userId, callback) {
    var query = { 'event.message.type': 'image' };
    if (userId !== '') query['event.source.userId'] = userId;
    Message.find(query, 'img.checkStatus.amount', function(err, messages) {
        if (err) return debug(err);
        var container = 0;
        var bag = 0;
        var tableware = 0;
        for (var i = 0; i < messages.length; i++) {
            container += messages[i].img.checkStatus.amount.container;
            bag += messages[i].img.checkStatus.amount.bag;
            tableware += messages[i].img.checkStatus.amount.tableware;
        }
        callback({
            container: container,
            bag: bag,
            tableware: tableware
        });
    });
}