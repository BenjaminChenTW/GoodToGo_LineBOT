var request = require('request');
var Message = require('./DB/messageDB.js');
var config = require('../config/config.js');
var debug = require('debug')('goodtogo-linebot:messageHandler');

module.exports = {
    textHandler: function(event, callback) {
        returnStr = '';
        message = new Message();
        message.event = event;
        if (event.message.text === "聯絡客服") {
            message.notify = true;
            returnStr += '已為您呼叫客服，煩請耐心等候。'
        } else if (event.message.text === "沒問題了") {
            message.notify = false;
            returnStr += '掰掰~~'
        }
        message.save(function(err) {
            if (err) return callback(false);
            return callback(true, event.replyToken, returnStr);
        });
    },
    imgHandler: function(event, callback) {
        imgBuffer = null

        message = new Message();
        message.event = event;
        request
            .get('https://api.line.me/v2/bot/message/' + event.message.id + '/content', {
                'auth': { 'bearer': config.bot.channelAccessToken }
            })
            .on('response', function(response) {
                if (response.statusCode !== 200) debug('[IMG Error (1)] StatusCode : ' + response.statusCode);
                else message.img.contentType = response.headers['content-type'];
            })
            .pipe(imgBuffer);
        message.img.data = imgBuffer;
        message.save(function(err) {
            if (err) return callback(false);
            return callback(true, event.replyToken, '收到你的照片！請等候審核。');
        });
    }
};