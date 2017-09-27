var express = require('express');
var router = express.Router();
var debug = require('debug')('goodtogo-linebot:imgAPI');

var getInitIndex = require('../models/imgProcess.js').getInitIndex;
var getInitList = require('../models/imgProcess.js').getInitList;
var getImageList = require('../models/imgProcess.js').getImageList;
var getImageListBackward = require('../models/imgProcess.js').getImageListBackward;
var templateSendler = require('../models/messageProcess.js').templateSendler;
var textSendler = require('../models/messageProcess.js').textSendler;
var lottery = require('../models/lotteryProcess.1.js').getTicket;
var Message = require('../models/DB/messageDB.js');
var Coupon = require('../models/DB/couponDB.js');

var couponIndex = 0
Coupon.findOne({}, {}, { sort: { 'CouponId': -1 } }, function(err, coupon) {
    if (coupon) couponIndex = coupon.couponId + 1;
});

router.get('/', function(req, res, next) {
    getInitIndex(next, function(lastIndex) {
        res.render('checkimg', {
            'lastIndex': lastIndex
        });
    });
});

router.get('/first/:id', function(req, res, next) {
    var id = req.params.id;
    getInitList(id, next, function(list) {
        res.json({ 'list': list });
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
    if (!(picIndex || amount)) return res.status(404).end();
    if (amount <= 0) return res.status(402).end();
    Message.findOne({ "img.id": picIndex }, function(err, message) {
        funcList = [];
        for (var i = 0; i < amount; i++) {
            funcList.push(
                new Promise((resolve, reject) => {
                    lottery(function(isWin, rank, name) {
                        coupon = new Coupon();
                        coupon.userId = message.event.source.userId;
                        coupon.couponId = couponIndex++;
                        coupon.priceType = rank;
                        coupon.priceName = name;
                        coupon.isWin = isWin;
                        coupon.save((err) => {
                            if (err) return reject(err);
                            templateSendler(message.event.source.userId, resolve, isWin, message.img.id);
                        });
                    });
                })
            );
        }
        Promise
            .all(funcList)
            .then((err) => {
                if (err) debug(JSON.stringify(err));
                message.img.checked = true;
                message.img.checkStatus.amount = amount;
                message.save((err) => {
                    if (err) res.status(200).end();
                });
            })
    });
});

const decline = ["不在音樂節現場拍攝", "中的容器無法識別為好盒器"]
router.post('/decline/:type/:id', function(req, res, next) {
    var picIndex = req.params.id;
    var declineType = req.params.type;
    if (!(picIndex || declineType)) return res.status(404).end();
    if (declineType !== 0 || declineType !== 1) return res.status(402).end();
    Message.findOne({ "img.id": picIndex }, function(err, message) {
        textSendler(message.event.source.userId, "您的照片 #" + picIndex + " 以完成審核/n但由於我們認為該照片" + decline[declineType] + "/n您無法獲得抽獎資格", function() {
            message.img.checked = true;
            message.img.checkStatus.typeCode = declineType;
            message.save((err) => {
                res.status(200).json({});
            });
        });
    });
});

module.exports = router;