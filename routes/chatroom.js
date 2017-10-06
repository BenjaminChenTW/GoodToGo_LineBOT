var express = require('express');
var router = express.Router();

var getFirst = require('../models/chatroomProcess.js').getFirst;
var getMessage = require('../models/chatroomProcess.js').getMessage;
var sendMessage = require('../models/chatroomProcess.js').sendMessage;
var getImg = require('../models/chatroomProcess.js').getImg;
var stopSession = require('../models/chatroomProcess.js').stopSession;
var hasUnread = require('../models/chatroomProcess.js').checkUnRead;

router.get('/', function(req, res, next) {
    getFirst(next, function(isEmpty, roomList) {
        if (isEmpty) {
            var err = new Error('No Msg');
            err.status = 404;
            next(err);
        } else {
            res.render('manager/chatroom', {
                'roomList': roomList,
                'lastRoom': req.session.userId || 'none',
                'online': global._online
            });
        }
    });
});

router.get('/:id', function(req, res, next) {
    var id = req.params.id;
    if (id === 'undefined') return res.status(404).end();
    req.session.userId = id;
    getMessage(id, next, function(isEmpty, messageList) {
        res.json({
            'isEmpty': isEmpty,
            'userMessage': messageList,
        });
    });
});

router.get('/img/:id', function(req, res, next) {
    var index = req.params.id;
    if (index === 'undefined') return res.status(404).end();
    getImg(index, next, function(obj) {
        res.json(obj);
    });
});

router.post('/terminateSession/:id', function(req, res, next) {
    var id = req.params.id;
    if (id === 'undefined') return res.status(404).end();
    stopSession(id, next, function(isSuccess) {
        if (isSuccess) {
            res.json({
                type: 'system',
                text: '結束此對話',
            });
        } else {
            res.json({
                type: 'system',
                text: '對話階段尚未開啟',
            });
        }
    });
});

router.post('/changestatus', function(req, res, next) {
    global._online = !global._online;
    console.log = global._online
    res.json({ online: global._online });
});

module.exports = {
    router: router,
    sendMsg: function(socket, userId, msg) {
        if (!userId || !msg) return socket.emit('server', { statusCode: 1, msg: "Content Lost" });
        sendMessage(userId, msg, function(err) {
            socket.emit('server', { statusCode: 2, msg: "ServerDB Error" + JSON.stringify(err) });
        }, function(userName, imgUrl, reject) {
            if (reject) return socket.emit('server', { statusCode: 3, msg: reject.text });
            hasUnread(function(hasUnread) {
                socket.emit('server', { statusCode: 0, msg: "Sended", unread: hasUnread });
                socket.broadcast.emit('user', { user: userId, name: userName, imgUrl: imgUrl, type: 'manager', msg: msg });
            });
        });
    },
    getMsg: function(io, userId, userName, imgUrl, msg, type = 'customer') {
        io.emit('user', { user: userId, name: userName, imgUrl: imgUrl, type: type, msg: msg });
    }
};