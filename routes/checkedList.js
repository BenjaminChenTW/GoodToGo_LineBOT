var express = require('express');
var router = express.Router();

var getImageList = require('../models/imgProcess.js').getImageList;
var Message = require('../models/DB/messageDB.js');

router.get('/', function(req, res, next) {
    res.render('checkedList');
});

router.get('/:index', function(req, res, next) {
    var index = req.params.index;
    getImageList(index, true, next, function(list) {
        Message.count({ 'event.message.type': 'image', 'img.checked': true }, function(err, amount) {
            res.json({
                'amount': amount,
                'list': list
            });
        });
    });
});

module.exports = router;