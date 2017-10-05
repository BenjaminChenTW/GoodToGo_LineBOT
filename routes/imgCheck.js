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

var couponIndex = 0;
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
    if (!(picIndex && container && bag && tableware)) return res.status(404).end();
    var amount = parseInt(container) + parseInt(bag) + parseInt(tableware);
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
                            coupon.userName = message.event.source.displayName;
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
                        global.imgEvent.emit('popImg', picIndex);
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
                    }, false, picIndex, "容器 - " + container + " 袋子 - " + bag + " 餐具 - " + tableware);
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
    if (!(picIndex && declineType)) return res.status(404).end();
    if (!(declineType == 0 || declineType == 1)) return res.status(402).end();

    picIndex = parseInt(picIndex);
    declineType = parseInt(declineType);

    Message.findOne({ "img.id": picIndex, "img.checked": false }, 'event.source img.checked img.checkStatus', function(err, message) {
        if (message) {
            textSendler(message.event.source.userId, '您的照片 #' + picIndex + ' 已完成審核，\n但由於我們認為該照片' + decline[declineType] + '，\n您無法獲得抽獎資格QQ', function() {
                global.imgEvent.emit('popImg', picIndex);
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

router.post('/ignore/:id', function(req, res, next) {
    var picIndex = req.params.id;
    if (!picIndex || picIndex === 'undefined') return res.status(404).end();
    picIndex = parseInt(picIndex);
    Message.findOne({ "img.id": picIndex }, 'read event.source.userId', function(err, message) {
        if (message) {
            textSendler(message.event.source.userId, '您的照片 #' + picIndex + ' 已取消審核。', function() {
                global.imgEvent.emit('popImg', picIndex);
                message.read = true;
                message.save((err) => {
                    if (err) debug(JSON.stringify(err));
                    res.status(200).end();
                });
            });
        } else {
            res.status(402).end();
        }
    });
});

module.exports = {
    router: router,
    addEvent: function(socket, index) {
        socket.emit('add', index);
    },
    popEvent: function(socket, index) {
        socket.emit('pop', index);
    }
};