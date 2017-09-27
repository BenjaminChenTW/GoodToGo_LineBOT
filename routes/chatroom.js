var express = require('express');
var router = express.Router();

var getFirst = require('../models/chatroomProcess.js').getFirst;
var getMessage = require('../models/chatroomProcess.js').getMessage;
var sendMessage = require('../models/chatroomProcess.js').sendMessage;

router.get('/', function(req, res, next) {
    getFirst(next, function(isEmpty, roomList) {
        if (isEmpty) {
            var err = new Error('Not Found');
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
    if (typeof id === 'undefined') return res.status(404).end();
    getMessage(id, next, function(isEmpty, messageList) {
        res.json({
            'isEmpty': isEmpty,
            'userMessage': messageList,
        });
    });
});

router.post('/:id', function(req, res, next) {
    var id = req.params.id;
    var msg = req.body['message'];
    if (typeof id === 'undefined' || typeof msg === 'undefined') return res.status(404).end();
    sendMessage(id, msg, next, function() {
        res.status(200).end();
    });
})

module.exports = router;