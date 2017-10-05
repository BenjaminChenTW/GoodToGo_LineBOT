var Message = require('./DB/messageDB.js');
var debug = require('debug')('goodtogo-linebot:usageProcess');

module.exports = function(userId, callback) {
    Message.find({ 'event.message.type': 'image' }, 'img.checkStatus.amount event.source.userId', function(err, messages) {
        if (err) return debug(err);
        var container = 0;
        var bag = 0;
        var tableware = 0;
        var allContainer = 0;
        var allBag = 0;
        var allTableware = 0;
        for (var i = 0; i < messages.length; i++) {
            if (messages[i].event.source.userId === userId) {
                container += messages[i].img.checkStatus.amount.container || 0;
                bag += messages[i].img.checkStatus.amount.bag || 0;
                tableware += messages[i].img.checkStatus.amount.tableware || 0;
            }
            allContainer += messages[i].img.checkStatus.amount.container || 0;
            allBag += messages[i].img.checkStatus.amount.bag || 0;
            allTableware += messages[i].img.checkStatus.amount.tableware || 0;
        }
        callback({
            reduce: (container * 110 + tableware * 50 + bag * 50),
            allReduce: (allContainer * 110 + allTableware * 50 + allBag * 50),
            container: container,
            bag: bag,
            tableware: tableware
        });
    });
}