var express = require('express');
var router = express.Router();

var getInitList = require('../models/imgProcess.js').getInitList;
var getImageList = require('../models/imgProcess.js').getImageList;
var getImageListBackward = require('../models/imgProcess.js').getImageListBackward;
var textSendler = require('../models/messageProcess.js').textSendler;
var lottery = require('../models/lotteryProcess.1.js');
var Message = require('../models/DB/messageDB.js');

router.get('/', function(req, res, next) {
    getInitList(getImageList, next, function(lastIndex, list) {
        res.render('checkimg', {
            'lastIndex': lastIndex,
            'list': list
        });
    });
});

router.get('/new/:id', function(req, res, next) {
    var id = req.params.id;
    getImageList(id, next, function(list) {
        res.json({ 'list': list });
    });
});

router.get('/old/:id', function(req, res, next) {
    var id = req.params.id;
    getImageListBackward(id, next, function(list) {
        res.json({ 'list': list });
    });
});

router.get('/accept/:amount/:id', function(req, res, next) {
    var picIndex = req.params.id;
    var amount = req.params.amount;
    // checked + checkedStatus
    // Message.findOne({ "img.id": picIndex }, function(err, message) {
    //     lottery(function(isWin, rank, name) {
    //         res.status(200).json({});
    //     });
    // });
    // 寫 Promise
});

const decline = ["不在音樂節現場拍攝", "中的容器無法識別為好盒器"]
router.get('/decline/:type/:id', function(req, res, next) {
    var picIndex = req.params.id;
    var declineType = req.params.type;
    // checked + checkedStatus
    Message.findOne({ "img.id": picIndex }, function(err, message) {
        textSendler(message.event.source.userId, "您的照片 #" + picIndex + " 以完成審核/n但由於我們認為該照片" + decline[declineType] + "/n您無法獲得抽獎資格", function() {
            res.status(200).json({});
        });
    });
});

module.exports = router;