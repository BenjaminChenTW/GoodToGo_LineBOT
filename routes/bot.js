/**
 * BOT init
 */
var config = require('../config/config.js');
const Client = require('@line/bot-sdk').Client;
const client = new Client(config.bot);
var debug = require('debug')('goodtogo-linebot:bot');

module.exports = {
    // event handler
    handleEvent: function(event) {
        if (event.type === 'message' && event.message.type === 'text') {
            if (event.message.text === "聯絡客服") {
                contactHandler(event, buttonsReply);
            } else if (event.message.text === "查看個人累積功德數") {
                rewardHandler(false, event, textReply);
                // rewardHandler(event, imgMapReply);
            } else if (event.message.text === "查看總體累積功德數") {
                rewardHandler(true, event, textReply);
                // rewardHandler(event, imgMapReply);
            } else {
                textHandler(event, textReply);
            }
        } else if (event.type === 'message' && event.message.type === 'image') {
            imgHandler(event, textReply);
        } else {
            return Promise.resolve(null);
        }
    },
    multicast: function(id, message, sended, imgUrl) {
        client.pushMessage(id, message)
            .then((res) => sended(imgUrl))
            .catch((err) => {
                debug(JSON.stringify(err.originalError.response.config.data));
                debug(JSON.stringify(err.originalError.response.data));
            });
    }
};

var textHandler = require('../models/messageProcess.js').textHandler;
var imgHandler = require('../models/messageProcess.js').imgHandler;
var contactHandler = require('../models/messageProcess.js').contactHandler;
var rewardHandler = require('../models/messageProcess.js').rewardHandler;

function textReply(success, replyToken, message) {
    if (!success) {
        message = '伺服器維修中...請聯繫客服或再嘗試一次！';
    } else if (message === '') {
        return Promise.resolve(null);
    }
    // create a echoing text message
    const echo = { type: 'text', text: message };
    // use reply API
    return client.replyMessage(replyToken, echo).catch((err) => {
        debug(JSON.stringify(err.originalError.response.config.data));
        debug(JSON.stringify(err.originalError.response.data));
    });
};

function buttonsReply(success, replyToken, message) {
    var echo = {};
    if (!success) {
        echo = { type: 'text', text: '伺服器維修中...請聯繫客服或再嘗試一次！' };
    } else {
        echo = {
            "type": "template",
            "altText": "對照片審核結果有疑問？",
            "template": {
                "type": "confirm",
                "text": '正在為您接通客服...\n您的問題有關照片審核結果嗎？',
                "actions": [{
                        "type": "message",
                        "label": "是",
                        "text": "我對照片審核結果有疑問"
                    },
                    {
                        "type": "message",
                        "label": "否",
                        "text": "其他問題"
                    }
                ]
            }
        };
    }
    return client.replyMessage(replyToken, echo).catch((err) => {
        debug(JSON.stringify(err.originalError.response.config.data));
        debug(JSON.stringify(err.originalError.response.data));
    });
};

function imgMapReply(success, replyToken, userId) {
    var echo = {};
    userId = ((userId === 'global') ? '' : ('/' + userId));
    if (!success) {
        echo = { type: 'text', text: '伺服器維修中...請聯繫客服或再嘗試一次！' };
    } else {
        echo = {
            "type": "imagemap",
            "baseUrl": "https://bot.goodtogo.tw/usage" + userId,
            "altText": "您的使用紀錄",
            "baseSize": {
                "height": 1040,
                "width": 585
            },
            "actions": [{
                "type": "uri",
                "linkUri": "https://bot.goodtogo.tw/usage" + userId,
                "area": {
                    "x": 0,
                    "y": 0,
                    "width": 585,
                    "height": 1040
                }
            }]
        };
    }
    return client.replyMessage(replyToken, echo).catch((err) => {
        debug(JSON.stringify(err.originalError.response.config.data));
        debug(JSON.stringify(err.originalError.response.data));
    });
};