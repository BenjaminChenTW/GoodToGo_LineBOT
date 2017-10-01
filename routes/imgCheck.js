var express = require('express');
var router = express.Router();
var debug = require('debug')('goodtogo-linebot:imgAPI');

var getInitIndex = require('../models/imgProcess.js').getInitIndex;
var getInitList = require('../models/imgProcess.js').getInitList;
var getImageList = require('../models/imgProcess.js').getImageList;
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

router.get('/:index', function(req, res, next) {
    var index = req.params.index;
    getImageList(index, false, next, function(list) {
        res.json({ 'list': list });
    });
});

router.post('/accept/:id/:container/:bag/:tableware', function(req, res, next) {
    var picIndex = req.params.id;
    var container = req.params.container;
    var bag = req.params.bag;
    var tableware = req.params.tableware;
    if (!(picIndex || amount)) return res.status(404).end();
    if (amount <= 0) return res.status(402).end();
    Message.findOne({ "img.id": picIndex, "img.checked": false }, 'event.source img.checked img.checkStatus', function(err, message) {
        if (message) {
            funcList = [];
            for (var i = 0; i < amount; i++) {
                funcList.push(
                    new Promise((resolve, reject) => {
                        lottery(function(isWin, rank, name) {
                            coupon = new Coupon();
                            coupon.userId = message.event.source.userId;
                            coupon.couponId = couponIndex++;
                            coupon.picIndex = picIndex;
                            coupon.prizeType = rank;
                            coupon.prizeName = name;
                            coupon.isWin = isWin;
                            coupon.save((err) => {
                                if (err) return reject(err);
                                resolve();
                            });
                        });
                    })
                );
            }
            Promise
                .all(funcList)
                .then((err) => {
                    for (var i = 0; i < err.length; i++) {
                        if (err[i]) {
                            debug('1: ' + JSON.stringify(err));
                            return res.status(402).end();
                        }
                    }
                    templateSendler(message.event.source.userId, function() {
                        message.img.checked = true;
                        message.img.checkStatus.amount = {
                            container: container,
                            bag: bag,
                            tableware: tableware
                        };
                        message.img.checkStatus.checkTime = Date.now();
                        message.save((err) => {
                            if (err) return debug('2: ' + JSON.stringify(err));
                            res.status(200).end();
                        });
                    }, false, picIndex);
                });
        } else {
            res.status(402).end();
        }
    });
});

const decline = ["不在音樂節現場拍攝", "中的容器無法識別為好盒器"]
router.post('/decline/:id/:type', function(req, res, next) {
    var picIndex = req.params.id;
    var declineType = req.params.type;
    if (!(picIndex || amount)) return res.status(404).end();
    if (!(declineType == 0 || declineType == 1)) return res.status(402).end();

    picIndex = parseInt(picIndex);
    declineType = parseInt(declineType);

    Message.findOne({ "img.id": picIndex, "img.checked": false }, 'event.source img.checked img.checkStatus', function(err, message) {
        if (message) {
            textSendler(message.event.source.userId, "您的照片 #" + picIndex + " 已完成審核，但由於我們認為該照片" + decline[declineType] + "，您無法獲得抽獎資格QQ", function() {
                message.img.checked = true;
                message.img.checkStatus.typeCode = declineType;
                message.img.checkStatus.checkTime = Date.now();
                message.save((err) => {
                    if (err) return debug(JSON.stringify(err));
                    res.status(200).json({});
                });
            });
        } else {
            res.status(402).json({});
        }
    });
});

module.exports = router;