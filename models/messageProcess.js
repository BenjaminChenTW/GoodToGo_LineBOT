var request = require('request');
var Message = require('./DB/messageDB.js');
var Coupon = require('../models/DB/couponDB.js');
var config = require('../config/config.js');
var multicast = require('../routes/bot.js').multicast;

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

function textSendlerCallback(id, message, sended) {
    var echo = { type: 'text', text: message };
    multicast(id, echo, sended);
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
        if (event.message.text === "聯絡客服") {
            message.notify = true;
            returnStr += '已為您呼叫客服，煩請耐心等候。'
        } else if (event.message.text === "沒問題了") {
            message.notify = false;
            returnStr += '掰掰~~'
        } else if (event.message.text === "查看累積功德數") {
            message.notify = false;
            returnStr += '不告訴你'
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
    },
    textSendler: function(lineUserId, message, sended) {
        textSendlerCallback(id, message, sended);
    },
    templateSendler: function(lineUserId, sended, isWin, couponId, couponType, couponContent) {
        var altText;
        var thumbnailImageUrl;
        var title;
        var text;
        var actions = [];
        if (!couponType) {
            Coupon.count({ "userId": lineUserId, "exchanged": false }, function(err, amount) {
                altText = "傳給您抽獎券！";
                thumbnailImageUrl = ""; // 抽檢券照片
                title = "抽獎券";
                text = "您的照片 #" + couponId + " 審核通過！\n目前您有" + amount + "次抽獎機會！";
                actions.push({
                    "type": "uri",
                    "label": "全部抽出",
                    "uri": "https://bot.goodtogo.tw/lottery/draw/" + lineUserId
                });
                templateSendlerCallback(lineUserId, {
                    altText: altText,
                    thumbnailImageUrl: thumbnailImageUrl,
                    title: title,
                    actions: actions
                }, sended);
            });
        } else {
            if (!isWin) {
                return textSendlerCallback(lineUserId, '請再接再厲！', sended);
            }
            altText = "傳給您一張兌換券！";
            title = "兌換券";
            text = "恭喜您抽中" + couponContent + "！\n請勿自行點按兌換鍵\n若因此喪失兌換資格恕不負責！"
            switch (couponType) {
                case 'A':
                    thumbnailImageUrl = ""; // A獎品照片
                    break;
                case 'B':
                    thumbnailImageUrl = ""; // B獎品照片
                    break;
                case 'C':
                    thumbnailImageUrl = ""; // C獎品照片
                    break;
                case 'D':
                    thumbnailImageUrl = ""; // D獎品照片
                    break;
                case 'E':
                    thumbnailImageUrl = ""; // E獎品照片
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