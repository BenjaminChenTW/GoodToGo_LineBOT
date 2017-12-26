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
    message['read'] = user.read;
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
                    var msg = '收到您的照片！但您的照片似乎重複上傳，若有疑問請聯絡客服。';
                    if (global._online === false) msg += '我們將於上線時回復您的訊息！';
                    msg += '錯誤代碼：'
                    callback(true, event.replyToken, msg + idIndex++);
                } else {
                    message.img.data = imgBuffer;
                    message.img.hash = hash;
                    message.img.checked = false;
                    message.img.id = idIndex;
                    message.save(function(err) {
                        if (err) return callback(false, event.replyToken);
                        global.imgEvent.emit('addImg', idIndex);
                        if (aFunc) aFunc();
                        var msg = '收到您的照片！您的照片編號為 #' + idIndex++;
                        if (global._online === false) msg += ' ，我們將於上線時為您審核！';
                        else msg += ' ，請靜候審核。';
                        return callback(true, event.replyToken, msg);
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
            if (!global._online) returnStr = '工作人員休息中！我們將在活動時間回覆你的訊息。活動時間：10/7-15，平日17:00 - 22:30；假日15:00 - 22:30。謝謝：）';
            if (user) {
                var displayName = user.event.source.displayName;
                var pictureUrl = user.event.source.pictureUrl;
                if (user.notify) global.aEvent.emit('getMsg', event.source.userId, displayName, pictureUrl, event.message.text);
                if (!user.notify && global._online) returnStr = '我是沒有聊天技能的機器人>"<！若需聯繫工作人員，請點選「聯絡工作人員」，將有專人回答您的問題，謝謝：）';
                regularHandlerCallback(message, {
                    displayName: displayName,
                    pictureUrl: pictureUrl,
                    isNotify: user.notify,
                    read: (!user.notify)
                }, returnStr, callback);
            } else {
                if (global._online) returnStr = '我是沒有聊天技能的機器人>"<！若需聯繫工作人員，請點選「聯絡工作人員」，將有專人回答您的問題，謝謝：）';
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
                    resData.read = true;
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
    normalHandler: function(route, event, callback) {
        if (route === 'usage') {
            var url = "https://app.goodtogo.tw/getImg/msg/BotUsage1";
        } else if (route === 'lottery/coupons') {
            var url = "https://app.goodtogo.tw/getImg/msg/BotCoupon1";
        }
        var returnStr = {
            url: url,
            msg: ("https://app.goodtogo.tw/" + route + '/' + event.source.userId)
        };
        message = new Message();
        message.event = event;
        Message.findOne({ 'event.source.userId': event.source.userId }, 'event.source notify', { sort: { 'event.timestamp': -1 } }, function(err, user) {
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
            if (user) {
                if (user.notify) {
                    var imgUrl = 'https://app.goodtogo.tw/getImg/' + idIndex;
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
                        if (err) {
                            callback(false, event.replyToken);
                            return debug(JSON.stringify(err));
                        }
                        imgHandlerCallback(message, {
                            displayName: user.event.source.displayName,
                            pictureUrl: user.event.source.pictureUrl,
                            isNotify: user.notify
                        }, event, callback, function() {
                            global.aEvent.emit('getMsg', event.source.userId, user.event.source.displayName, imgUrl, imgText, 'system');
                        });
                    });
                } else {
                    imgHandlerCallback(message, {
                        displayName: user.event.source.displayName,
                        pictureUrl: user.event.source.pictureUrl,
                        isNotify: user.notify
                    }, event, callback);
                }
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
            Coupon.count({ "userId": lineUserId, "exchanged": false, "read": false }, function(err, amount) {
                if (err) {
                    sended(err);
                    return debug(JSON.stringify(err));
                }
                console.log("amount : " + amount)
                altText = "好盒器傳給您抽獎券！";
                thumbnailImageUrl = "https://app.goodtogo.tw/getImg/" + couponId;
                title = "抽獎券";
                text = "您的照片 #" + couponId + " 審核通過！\n審核結果：" + couponType + "\n目前您總共有" + amount + "次抽獎機會！";
                actions.push({
                    "type": "uri",
                    "label": "開始抽獎！",
                    "uri": "https://app.goodtogo.tw/lottery/draw/" + lineUserId
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
            title = "兌換券 #" + couponId;
            text = "恭喜您抽中" + couponContent + "！"
            thumbnailImageUrl = "https://app.goodtogo.tw/getImg/prize/" + couponType;
            actions.push({
                "type": "uri",
                "label": "兌換",
                "uri": "https://app.goodtogo.tw/lottery/coupons/" + lineUserId + "/" + couponId
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