var express = require('express');
var router = express.Router();
var debug = require('debug')('goodtogo-linebot:imgAPI');

var getInitIndex = require('../models/imgProcess.js').getInitIndex;
var getInitList = require('../models/imgProcess.js').getInitList;
var getImageList = require('../models/imgProcess.js').getImageList;
var templateSendler = require('../models/messageProcess.js').templateSendler;
var textSendler = require('../models/messageProcess.js').textSendler;
var lottery = require('../models/lotteryProcess.js').getTicket;
var saveFile = require('../models/lotteryProcess.js').saveFile;
var Message = require('../models/DB/messageDB.js');
var Coupon = require('../models/DB/couponDB.js');
var hasUnchecked = require('../models/imgProcess.js').checkUnckecked;

var couponIndex = 0;
Coupon.findOne({}, 'couponId', { sort: { 'couponId': -1 } }, function(err, coupon) {
    if (coupon) couponIndex = coupon.couponId + 1;
    debug(couponIndex)
});

router.get('/', function(req, res, next) {
    getInitIndex(next, function(lastIndex) {
        res.render('manager/checkimg', {
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

router.post('/accept/:id/:bag/:container/:tableware', function(req, res, next) {
    var picIndex = req.params.id;
    var container = req.params.container;
    var bag = req.params.bag;
    var tableware = req.params.tableware;
    if (!(picIndex && container && bag && tableware)) return res.status(404).end();
    var amount = parseInt(container) + parseInt(bag) + parseInt(tableware);
    if (amount <= 0) return res.status(402).end();
    process.nextTick(function() {
        Message.findOne({ "img.id": picIndex, "img.checked": false }, 'event.source img.checked img.checkStatus', function(err, message) {
            if (err) return res.status(403).end();
            if (message) {
                var funcList = [];
                for (var i = 0; i < amount; i++) {
                    funcList.push(
                        new Promise((resolve, reject) => {
                            lottery(function(isWin, rank, name) {
                                coupon = new Coupon();
                                coupon.userId = message.event.source.userId;
                                coupon.userName = message.event.source.displayName;
                                coupon.picIndex = picIndex;
                                coupon.couponId = couponIndex++;
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
                        saveFile();
                        for (var i = 0; i < err.length; i++) {
                            if (err[i]) {
                                debug('1: ' + JSON.stringify(err));
                                return res.status(402).end();
                            }
                        }
                        // console.log('pass')
                        templateSendler(message.event.source.userId, function() {
                            message.img.checked = true;
                            message.img.checkStatus.amount = {
                                container: container,
                                bag: bag,
                                tableware: tableware
                            };
                            message.img.checkStatus.checkTime = Date.now();
                            message.save((err) => {
                                if (err) {
                                    res.status(403).end();
                                    return debug('2: ' + JSON.stringify(err));
                                }
                                global.imgEvent.emit('popImg', picIndex);
                                res.status(200).end();
                            });
                        }, false, picIndex, "容器 - " + container + " 袋子 - " + bag + " 餐具 - " + tableware);
                    })
                    .catch((err) => {
                        debug(err);
                        return res.status(403).end();
                    });
            } else {
                res.status(402).end();
            }
        });
    });
});

const decline = ["該照片不在音樂節現場拍攝", "該照片中的容器無法識別為好盒器"]
router.post('/decline/:id/:type', function(req, res, next) {
    var picIndex = req.params.id;
    var declineType = req.params.type;
    var declineReason;
    if (!(picIndex && declineType)) return res.status(404).end();

    picIndex = parseInt(picIndex);
    declineType = parseInt(declineType);

    if (declineType == 2) declineReason = req.body.otherReason || '';
    else if (declineType >= 0 || declineType == 1) declineReason = decline[declineType];
    else return res.status(402).end();

    Message.findOne({ "img.id": picIndex, "img.checked": false }, 'event.source img.checked img.checkStatus', function(err, message) {
        if (message) {
            textSendler(message.event.source.userId, '您的照片 #' + picIndex + ' 已完成審核，\n但由於我們認為' + declineReason + '，\n您無法獲得抽獎資格QQ', function() {
                message.img.checked = true;
                message.img.checkStatus.typeCode = declineType;
                message.img.checkStatus.reason = declineReason;
                message.img.checkStatus.checkTime = Date.now();
                message.save((err) => {
                    if (err) return debug(JSON.stringify(err));
                    global.imgEvent.emit('popImg', picIndex);
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
                message.read = true;
                message.save((err) => {
                    if (err) debug(JSON.stringify(err));
                    global.imgEvent.emit('popImg', picIndex);
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
        hasUnchecked(function(hasRemain) {
            socket.emit('pop', { index: index, remain: hasRemain });
        });
    }
};