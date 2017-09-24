/**
 * BOT init
 */
var config = require('../config/config.js');
const Client = require('@line/bot-sdk').Client;
const client = new Client(config.bot);
var textHandler = require('../models/messageProcess.js').textHandler;
var imgHandler = require('../models/messageProcess.js').imgHandler;

function handlerCallback(success, replyToken, message) {
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

module.exports = {
    // event handler
    handleEvent: function(event) {
        if (event.type === 'message' && event.message.type === 'text') {
            textHandler(event, handlerCallback);
        } else if (event.type === 'message' && event.message.type === 'image') {
            imgHandler(event, handlerCallback);
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