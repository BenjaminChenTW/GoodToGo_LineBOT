var express = require('express');
var router = express.Router();

var getFirst = require('../models/chatroomProcess.js').getFirst;
var getMessage = require('../models/chatroomProcess.js').getMessage;
var sendMessage = require('../models/chatroomProcess.js').sendMessage;
var getImg = require('../models/chatroomProcess.js').getImg;

router.get('/', function(req, res, next) {
    getFirst(next, function(isEmpty, roomList) {
        if (isEmpty) {
            var err = new Error('No Msg');
            err.status = 404;
            next(err);
        } else {
            res.render('chatroom', {
                'roomList': roomList
            });
        }
    });
});

router.get('/:id', function(req, res, next) {
    var id = req.params.id;
    if (id === 'undefined') return res.status(404).end();
    getMessage(id, next, function(isEmpty, messageList) {
        res.json({
            'isEmpty': isEmpty,
            'userMessage': messageList,
        });
    });
});

router.get('/img/:id', function(req, res, next) {
    var index = req.params.id;
    if (id === 'undefined') return res.status(404).end();
    getImg(id, next, function(obj) {
        res.json(obj);
    });
});

module.exports = {
    router: router,
    sendMsg: function(socket, userId, msg) {
        if (!userId || !msg) return socket.emit('server', { msg: "Content Lost" });
        sendMessage(userId, msg, function(err) {
            socket.emit('server', { msg: "ServerDB Error" + JSON.stringify(err) });
        }, function() {
            socket.emit('server', { msg: "Sended" });
            socket.broadcast.emit(userId, { type: 'manager', msg: msg });
        });
    },
    getMsg: function(io, userId, msg) {
        io.emit(userId, { type: 'customer', msg: msg });
    }
};