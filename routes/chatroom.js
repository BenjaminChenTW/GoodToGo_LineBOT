var express = require('express');
var router = express.Router();

var getFirst = require('../models/chatroomProcess.js').getFirst;
var getMessage = require('../models/chatroomProcess.js').getMessage;

router.get('/', function(req, res, next) {
    getFirst(next, function(id) {
        res.redirect('http://localhost:3000/chatroom/' + id);
        // res.writeHead(301, { Location: 'https://bot.goodtogo.tw/chatroom/' + id });
    });
});

router.get('/:id', function(req, res, next) {
    var id = req.params.id;
    getMessage(id, next, function(messages) {
        res.json(messages);
    });
});

module.exports = router;