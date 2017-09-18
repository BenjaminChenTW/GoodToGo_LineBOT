/**
 * BOT init
 */
var config = require('../config/config.js');
const Client = require('@line/bot-sdk').Client;
const client = new Client(config.bot);

module.exports = {
    // event handler
    handleEvent: function(event) {
        if (event.type !== 'message' || event.message.type !== 'text') {
            // ignore non-text-message event
            return Promise.resolve(null);
        }

        // create a echoing text message
        const echo = { type: 'text', text: event.message.text };

        // use reply API
        return client.replyMessage(event.replyToken, echo);
    }
};