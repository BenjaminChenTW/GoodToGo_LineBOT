var request = require('request');
var crypto = require('crypto');
var debug = require('debug')('goodtogo-linebot:messageHandler');

var Message = require('./DB/messageDB.js');
var Coupon = require('../models/DB/couponDB.js');
var config = require('../config/config.js');
var multicast = require('../routes/bot.js').multicast;

function regularHandlerCallback(message, user, returnStr, callback) {
    message.event.source['displayName'] = user.displayName;
    message.event.source['pictureUrl'] = user.pictureUrl;
    message['notify'] = user.isNotify;
    message.save(function(err) {
        if (err) return callback(false, message.event.replyToken);
        return callback(true, message.event.replyToken, returnStr);
    });
}

function imgHandlerCallback(message, user, event, callback, aFunc) {
    var imgBufferList = [];
    message.event.source['displayName'] = user.displayName;
    message.event.source['pictureUrl'] = user.pictureUrl;
    message['notify'] = user.isNotify;
    request
        .get('https://api.line.me/v2/bot/message/' + event.message.id + '/content', {
            'auth': { 'bearer': config.bot.channelAccessToken }
        })
        .on('response', function(response) {
            if (response.statusCode !== 200) {
                debug('[IMG Error (1)] StatusCode : ' + response.statusCode);
                return callback(false, event.replyToken);
            } else message.img.contentType = response.headers['content-type'];
        })
        .on('error', function(err) {
            debug('[IMG Error (2)] Message : ' + err);
            return callback(false, event.replyToken);
        })
        .on('data', function(data) {
            imgBufferList.push(data);
        })
        .on('end', function() {
            var imgBuffer = Buffer.concat(imgBufferList);
            var hash = crypto.createHash('md5').update(imgBuffer).digest("hex");
            Message.findOne({ 'img.hash': hash }, 'img.id', function(err, img) {
                if (img) {
                    callback(true, event.replyToken, '收到您的照片！\n但您的照片似乎重複上傳，\n若有疑問請聯絡客服。\n錯誤代碼：' + idIndex++);
                } else {
                    message.img.data = imgBuffer;
                    message.img.hash = hash;
                    message.img.checked = false;
                    message.img.id = idIndex;
                    message.save(function(err) {
                        if (err) return callback(false, event.replyToken);
                        global.imgEvent.emit('addImg', idIndex);
                        if (aFunc) aFunc();
                        return callback(true, event.replyToken, '收到您的照片！\n您的照片編號為 #' + idIndex++ + ' ，\n請靜候審核。');
                    });
                }
            });
        });
}

function textSendlerCallback(id, message, sended, name, imgUrl) {
    var echo = { type: 'text', text: message };
    multicast(id, echo, sended, name, imgUrl);
}

function templateSendlerCallback(id, messageContent, sended) {
    var echo = {
        "type": "template",
        "altText": messageContent.altText,
        "template": {
            "type": "buttons",
            "thumbnailImageUrl": messageContent.thumbnailImageUrl,
            "title": messageContent.title,
            "text": messageContent.text,
            "actions": messageContent.actions
        }
    };
    multicast(id, echo, sended);
}

module.exports = {
    textHandler: function(event, callback) {
        var returnStr = '';
        message = new Message();
        message.event = event;
        Message.findOne({ 'event.source.userId': event.source.userId }, 'notify event.source', { sort: { 'event.timestamp': -1 } }, function(err, user) {
            if (err) return debug(JSON.stringify(err));
            if (!user.notify) returnStr += "若需聯絡客服，請按聯絡客服鍵。";
            if (user) {
                var displayName = user.event.source.displayName;
                var pictureUrl = user.event.source.pictureUrl;
                if (user.notify) global.aEvent.emit('getMsg', event.source.userId, displayName, pictureUrl, event.message.text);
                regularHandlerCallback(message, {
                    displayName: displayName,
                    pictureUrl: pictureUrl,
                    isNotify: user.notify
                }, returnStr, callback);
            } else {
                request('https://api.line.me/v2/bot/profile/' + event.source.userId, {
                    'auth': { 'bearer': config.bot.channelAccessToken }
                }, function(error, response, body) {
                    if (error) {
                        debug('[PROFILE Error (2)] Message : ' + error);
                        return callback(false, event.replyToken);
                    }
                    if (response.statusCode !== 200) {
                        debug('[PROFILE Error (1)] StatusCode : ' + response.statusCode);
                        return callback(false, event.replyToken);
                    }
                    var resData = JSON.parse(body);
                    resData.isNotify = false;
                    regularHandlerCallback(message, resData, returnStr, callback);
                });
            }
        });
    },
    contactHandler: function(event, callback) {
        var returnStr = 'contact';
        message = new Message();
        message.event = event;
        Message.findOne({ 'event.source.userId': event.source.userId }, 'event.source', { sort: { 'event.timestamp': -1 } }, function(err, user) {
            if (err) return debug(JSON.stringify(err));
            if (user) {
                var displayName = user.event.source.displayName;
                var pictureUrl = user.event.source.pictureUrl;
                global.aEvent.emit('getMsg', event.source.userId, displayName, pictureUrl, event.message.text);
                regularHandlerCallback(message, {
                    displayName: displayName,
                    pictureUrl: pictureUrl,
                    isNotify: true
                }, returnStr, callback);
            } else {
                request('https://api.line.me/v2/bot/profile/' + event.source.userId, {
                    'auth': { 'bearer': config.bot.channelAccessToken }
                }, function(error, response, body) {
                    if (error) {
                        debug('[PROFILE Error (2)] Message : ' + error);
                        return callback(false, event.replyToken);
                    }
                    if (response.statusCode !== 200) {
                        debug('[PROFILE Error (1)] StatusCode : ' + response.statusCode);
                        return callback(false, event.replyToken);
                    }
                    var resData = JSON.parse(body);
                    global.aEvent.emit('getMsg', event.source.userId, resData.displayName, resData.pictureUrl, event.message.text);
                    resData.isNotify = true;
                    regularHandlerCallback(message, resData, returnStr, callback);
                });
            }
        });
    },
    rewardHandler: function(isGlobal, event, callback) {
        var returnStr = (isGlobal) ? 'global' : event.source.userId;
        message = new Message();
        message.event = event;
        Message.findOne({ 'event.source.userId': event.source.userId }, 'event.source', { sort: { 'event.timestamp': -1 } }, function(err, user) {
            if (err) return debug(JSON.stringify(err));
            if (user) {
                regularHandlerCallback(message, {
                    displayName: user.event.source.displayName,
                    pictureUrl: user.event.source.pictureUrl,
                    isNotify: user.notify
                }, returnStr, callback);
            } else {
                request('https://api.line.me/v2/bot/profile/' + event.source.userId, {
                    'auth': { 'bearer': config.bot.channelAccessToken }
                }, function(error, response, body) {
                    if (error) {
                        debug('[PROFILE Error (2)] Message : ' + error);
                        return callback(false, event.replyToken);
                    }
                    if (response.statusCode !== 200) {
                        debug('[PROFILE Error (1)] StatusCode : ' + response.statusCode);
                        return callback(false, event.replyToken);
                    }
                    var resData = JSON.parse(body);
                    resData.isNotify = false;
                    regularHandlerCallback(message, resData, returnStr, callback);
                });
            }
        });
    },
    imgHandler: function(event, callback) {
        message = new Message();
        message.event = event;
        Message.findOne({ 'event.source.userId': event.source.userId }, 'event.source notify', { sort: { 'event.timestamp': -1 } }, function(err, user) {
            if (err) return debug(JSON.stringify(err));
            if (user.notify) {
                var imgUrl = 'https://bot.goodtogo.tw/getImg/' + idIndex;
                var imgText = '使用者傳來一張圖片！\n' + imgUrl;
                imgMessage = new Message();
                imgMessage.event = {
                    message: {
                        text: imgText,
                        type: 'text'
                    },
                    timestamp: Date.now(),
                    source: {
                        type: 'system',
                        userId: event.source.userId,
                        displayName: user.event.source.displayName,
                        pictureUrl: user.event.source.pictureUrl
                    }
                };
                imgMessage.read = true;
                imgMessage['notify'] = true;
                imgMessage.save(function(err) {
                    if (err) debug(JSON.stringify(err));
                });

                function emitAEvent() {
                    global.aEvent.emit('getMsg', event.source.userId, user.event.source.displayName, imgUrl, imgText, 'system');
                };
            }
            if (user) {
                imgHandlerCallback(message, {
                    displayName: user.event.source.displayName,
                    pictureUrl: user.event.source.pictureUrl,
                    isNotify: user.notify
                }, event, callback, emitAEvent);
            } else {
                request('https://api.line.me/v2/bot/profile/' + event.source.userId, {
                    'auth': { 'bearer': config.bot.channelAccessToken }
                }, function(error, response, body) {
                    if (error) {
                        debug('[PROFILE Error (2)] Message : ' + error);
                        return callback(false, event.replyToken);
                    }
                    if (response.statusCode !== 200) {
                        debug('[PROFILE Error (1)] StatusCode : ' + response.statusCode);
                        return callback(false, event.replyToken);
                    }
                    var resData = JSON.parse(body);
                    resData.isNotify = false;
                    imgHandlerCallback(message, resData, event, callback);
                });
            }
        });
    },
    textSendler: function(lineUserId, message, sended, name, imgUrl) {
        textSendlerCallback(lineUserId, message, sended, name, imgUrl);
    },
    templateSendler: function(lineUserId, sended, isWin, couponId, couponType, couponContent) {
        var altText;
        var thumbnailImageUrl;
        var title;
        var text;
        var actions = [];
        if (!couponContent) {
            Coupon.count({ "userId": lineUserId, "exchanged": false }, function(err, amount) {
                if (err) return debug(JSON.stringify(err));
                altText = "好盒器傳給您抽獎券！";
                thumbnailImageUrl = "https://bot.goodtogo.tw/getImg/" + couponId;
                title = "抽獎券";
                text = "您的照片 #" + couponId + " 審核通過！\n審核結果：" + couponType + "\n目前您總共有" + amount + "次抽獎機會！";
                actions.push({
                    "type": "uri",
                    "label": "開始抽獎！",
                    "uri": "https://bot.goodtogo.tw/lottery/draw/" + lineUserId
                });
                templateSendlerCallback(lineUserId, {
                    altText: altText,
                    thumbnailImageUrl: thumbnailImageUrl,
                    title: title,
                    text: text,
                    actions: actions
                }, sended);
            });
        } else {
            if (!isWin) {
                return textSendlerCallback(lineUserId, '請再接再厲！', sended);
            }
            altText = "好盒器傳給您一張兌換券！";
            title = "兌換券";
            text = "恭喜您抽中" + couponContent + "！\n請勿自行點按兌換鍵，\n若因此喪失兌換資格恕不負責！"
            thumbnailImageUrl = "https://bot.goodtogo.tw/getImg/prize/" + couponType;
            actions.push({
                "type": "uri",
                "label": "兌換",
                "uri": "https://bot.goodtogo.tw/lottery/exchange/" + couponId
            });
            templateSendlerCallback(lineUserId, {
                altText: altText,
                thumbnailImageUrl: thumbnailImageUrl,
                title: title,
                text: text,
                actions: actions
            }, sended);
        }
    }
};

var idIndex = 0
Message.findOne({ 'event.message.type': 'image' }, {}, { sort: { 'img.id': -1 } }, function(err, message) {
    if (message) idIndex = message.img.id + 1;
});