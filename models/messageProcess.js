var request = require('request');
var Message = require('./DB/messageDB.js');
var config = require('../config/config.js');

var lottery = require('../models/lottery/lottery.js');
var debug = require('debug')('goodtogo-linebot:messageHandler');

function textHandlerCallback(message, user, returnStr, callback) {
    message.event.source['displayName'] = user.displayName;
    message.event.source['pictureUrl'] = user.pictureUrl;
    message.save(function(err) {
        if (err) return callback(false);
        return callback(true, message.event.replyToken, returnStr);
    });
}

function imgHandlerCallback(message, user, event, callback) {
    message.event.source['displayName'] = user.displayName;
    message.event.source['pictureUrl'] = user.pictureUrl;
    request
        .get('https://api.line.me/v2/bot/message/' + event.message.id + '/content', {
            'auth': { 'bearer': config.bot.channelAccessToken }
        })
        .on('response', function(response) {
            if (response.statusCode !== 200) {
                debug('[IMG Error (1)] StatusCode : ' + response.statusCode);
                return callback(false);
            } else message.img.contentType = response.headers['content-type'];
        })
        .on('error', function(err) {
            debug('[IMG Error (2)] Message : ' + err);
            return callback(false);
        })
        .on('data', function(data) {
            imgBuffer.push(data);
        })
        .on('end', function() {
            message.img.data = Buffer.concat(imgBuffer);
            message.img.checked = false;
            message.img.id = idIndex;
            message.save(function(err) {
                if (err) return callback(false);
                return callback(true, event.replyToken, '收到您的照片！\n您的照片編號為：' + idIndex++ + '\n請靜候審核。');
            });
        });
}

module.exports = {
    textHandler: function(event, callback) {
        var returnStr = '';
        message = new Message();
        message.event = event;
        if (event.message.text === "聯絡客服") {
            message.notify = true;
            returnStr += '已為您呼叫客服，煩請耐心等候。'
        } else if (event.message.text === "沒問題了") {
            message.notify = false;
            returnStr += '掰掰~~'
        }
        Message.findOne({ 'event.source.userId': event.source.userId }, function(err, user) {
            if (user) {
                textHandlerCallback(message, {
                    displayName: user.event.source.displayName,
                    pictureUrl: user.event.source.pictureUrl
                }, returnStr, callback);
            } else {
                request('https://api.line.me/v2/bot/profile/' + event.source.userId, {
                    'auth': { 'bearer': config.bot.channelAccessToken }
                }, function(error, response, body) {
                    if (error) {
                        debug('[PROFILE Error (2)] Message : ' + error);
                        return callback(false);
                    }
                    if (response.statusCode !== 200) {
                        debug('[PROFILE Error (1)] StatusCode : ' + response.statusCode);
                        return callback(false);
                    }
                    var resData = JSON.parse(body);
                    textHandlerCallback(message, resData, returnStr, callback);
                });
            }
        });
    },
    imgHandler: function(event, callback) {
        lottery(function(isWin, price, replyMessage) {
            callback(event.replyToken, replyMessage);
        });
    },
    imgHandler1: function(event, callback) {
        imgBuffer = [];
        message = new Message();
        message.event = event;
        Message.findOne({ 'event.source.userId': event.source.userId }, function(err, user) {
            if (user) {
                imgHandlerCallback(message, {
                    displayName: user.event.source.displayName,
                    pictureUrl: user.event.source.pictureUrl
                }, event, callback);
            } else {
                request('https://api.line.me/v2/bot/profile/' + event.source.userId, {
                    'auth': { 'bearer': config.bot.channelAccessToken }
                }, function(error, response, body) {
                    if (error) {
                        debug('[PROFILE Error (2)] Message : ' + error);
                        return callback(false);
                    }
                    if (response.statusCode !== 200) {
                        debug('[PROFILE Error (1)] StatusCode : ' + response.statusCode);
                        return callback(false);
                    }
                    var resData = JSON.parse(body);
                    imgHandlerCallback(message, resData, event, callback);
                });
            }
        });
    }
};

var idIndex = 0
Message.findOne({ 'event.message.type': 'image' }, {}, { sort: { 'img.id': -1 } }, function(err, message) {
    if (message) idIndex = message.img.id + 1;
});