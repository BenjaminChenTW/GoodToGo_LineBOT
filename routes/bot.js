/**
 * BOT init
 */
var config = require('../config/config.js');
const Client = require('@line/bot-sdk').Client;
const client = new Client(config.bot);
var textHandler = require('../models/messageProcess.js').textHandler;
var imgHandler = require('../models/messageProcess.js').imgHandler;

function textReply(success, replyToken, message) {
    if (!success) {
        message = '伺服器維修中...'
    } else if (message === '') {
        return Promise.resolve(null);
    }
    // create a echoing text message
    const echo = { type: 'text', text: message };
    // use reply API
    return client.replyMessage(replyToken, echo);
};


function lotteryReply(replyToken, echo) {
    var echo = {
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
    // use reply API
    return client.replyMessage(replyToken, echo).catch((err) => {
        console.log(err.originalError.response.config.data)
        console.log(err.originalError.response.data)
    });
};

module.exports = {
    // event handler
    handleEvent: function(event) {
        if (event.type === 'message' && event.message.type === 'text') {
            textHandler(event, textReply);
        } else if (event.type === 'message' && event.message.type === 'image') {
            imgHandler(event, lotteryReply);
        } else {
            // ignore non-text-message event
            return Promise.resolve(null);
        }
    },
    multicast: function(id, message) {
        client.pushMessage(id, message)
            .then(() => {
                console.log(message)
            })
            .catch((err) => {
                console.log(err)
            })
    }
};