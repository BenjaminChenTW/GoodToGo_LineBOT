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
            if (event.message.text === "聯絡客服")
                contactHandler(event, textReply);
            // contactHandler(event, buttonsReply);
            else if (event.message.text === "查看累積功德數")
                rewardHandler(event, textReply);
            // rewardHandler(event, imgMapReply);
            else
                textHandler(event, textReply);
        } else if (event.type === 'message' && event.message.type === 'image') {
            imgHandler(event, textReply);
        } else {
            // ignore non-text-or-image-message event
            return Promise.resolve(null);
        }
    },
    multicast: function(id, message, sended) {
        client.pushMessage(id, message)
            .then((res) => sended())
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
        message = '伺服器維修中...'
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