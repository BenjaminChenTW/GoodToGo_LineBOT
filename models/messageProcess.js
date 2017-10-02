var request = require('request');
var crypto = require('crypto');
var debug = require('debug')('goodtogo-linebot:messageHandler');

var Message = require('./DB/messageDB.js');
var Coupon = require('../models/DB/couponDB.js');
var config = require('../config/config.js');
var multicast = require('../routes/bot.js').multicast;


function textHandlerCallback(message, user, returnStr, callback) {
    message.event.source['displayName'] = user.displayName;
    message.event.source['pictureUrl'] = user.pictureUrl;
    message['notify'] = user.isNotify;
    message.save(function(err) {
        if (err) return callback(false, message.event.replyToken);
        return callback(true, message.event.replyToken, returnStr);
    });
}

function imgHandlerCallback(message, user, event, callback) {
    var imgBufferList = [];
    message.event.source['displayName'] = user.displayName;
    message.event.source['pictureUrl'] = user.pictureUrl;
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
                        return callback(true, event.replyToken, '收到您的照片！\n您的照片編號為 #' + idIndex++ + ' ，\n請靜候審核。');
                    });
                }
            });
        });
}

function textSendlerCallback(id, message, sended, imgUrl) {
    var echo = { type: 'text', text: message };
    multicast(id, echo, sended, imgUrl);
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
            if (user.notify) global.aEvent.emit('getMsg', event.source.userId, user.event.source.pictureUrl, event.message.text);
            else returnStr += "若需聯絡客服，請按聯絡客服鍵。";
            if (user) {
                textHandlerCallback(message, {
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
                    textHandlerCallback(message, resData, returnStr, callback);
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
                global.aEvent.emit('getMsg', event.source.userId, user.event.source.pictureUrl, event.message.text);
                textHandlerCallback(message, {
                    displayName: user.event.source.displayName,
                    pictureUrl: user.event.source.pictureUrl,
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
                    global.aEvent.emit('getMsg', event.source.userId, resData.pictureUrl, event.message.text);
                    resData.isNotify = true;
                    textHandlerCallback(message, resData, returnStr, callback);
                });
            }
        });
    },
    rewardHandler: function(event, callback) {
        var returnStr = '';
        message = new Message();
        message.event = event;
        Message.findOne({ 'event.source.userId': event.source.userId }, 'event.source', { sort: { 'event.timestamp': -1 } }, function(err, user) {
            if (err) return debug(JSON.stringify(err));
            if (user) {
                textHandlerCallback(message, {
                    displayName: user.event.source.displayName,
                    pictureUrl: user.event.source.pictureUrl,
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
                    textHandlerCallback(message, resData, returnStr, callback);
                });
            }
        });
    },
    imgHandler: function(event, callback) {
        message = new Message();
        message.event = event;
        Message.findOne({ 'event.source.userId': event.source.userId }, 'event.source', { sort: { 'event.timestamp': -1 } }, function(err, user) {
            if (err) return debug(JSON.stringify(err));
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
                        return callback(false, event.replyToken);
                    }
                    if (response.statusCode !== 200) {
                        debug('[PROFILE Error (1)] StatusCode : ' + response.statusCode);
                        return callback(false, event.replyToken);
                    }
                    var resData = JSON.parse(body);
                    imgHandlerCallback(message, resData, event, callback);
                });
            }
        });
    },
    textSendler: function(lineUserId, message, sended, imgUrl) {
        textSendlerCallback(lineUserId, message, sended, imgUrl);
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
                thumbnailImageUrl = "https://bot.goodtogo.tw/getImg/" + couponId; // 抽檢券照片
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
            text = "恭喜您抽中" + couponContent + "！\n請勿自行點按兌換鍵\n若因此喪失兌換資格恕不負責！"
            switch (couponType) {
                case 'A':
                    thumbnailImageUrl = "https://163a5d76.ngrok.io/assets/icon/checked.png"; // A獎品照片
                    break;
                case 'B':
                    thumbnailImageUrl = "https://163a5d76.ngrok.io/assets/icon/checked.png"; // B獎品照片
                    break;
                case 'C':
                    thumbnailImageUrl = "https://163a5d76.ngrok.io/assets/icon/checked.png"; // C獎品照片
                    break;
                case 'D':
                    thumbnailImageUrl = "https://163a5d76.ngrok.io/assets/icon/checked.png"; // D獎品照片
                    break;
                case 'E':
                    thumbnailImageUrl = "https://163a5d76.ngrok.io/assets/icon/checked.png"; // E獎品照片
                    break;
            }
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

var template = {
    "type": "template",
    "altText": "this is a buttons template",
    "template": {
        "type": "buttons",
        "thumbnailImageUrl": "https://163a5d76.ngrok.io/assets/icon/checked.png",
        "title": "Menu",
        "text": "Please select",
        "actions": [{
                "type": "postback",
                "label": "Buy",
                "data": "action=buy&itemid=123"
            },
            {
                "type": "postback",
                "label": "Add to cart",
                "data": "action=add&itemid=123"
            },
            {
                "type": "uri",
                "label": "View detail",
                "uri": "https://163a5d76.ngrok.io/img"
            }
        ]
    }
};