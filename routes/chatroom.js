var express = require('express');
var router = express.Router();

var getFirst = require('../models/chatroomProcess.js').getFirst;
var getMessage = require('../models/chatroomProcess.js').getMessage;

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
    getMessage(id, next, function(isEmpty, messageList) {
        res.json({
            'isEmpty': isEmpty,
            'userMessage': messageList,
        });
    });
});

module.exports = router;