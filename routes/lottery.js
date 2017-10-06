var express = require('express');
var router = express.Router();
var recordRouter = express.Router();
var debug = require('debug')('goodtogo-linebot:lottery');

var Coupon = require('../models/DB/couponDB.js');
var templateSendler = require('../models/messageProcess.js').templateSendler;

var fs = require('fs');

router.get('/draw/:id', function(req, res, next) {
    var id = req.params.id;
    if (id === 'undefined') return next();
    Coupon.find({ 'userId': id, 'read': false }, {}, { sort: { 'couponId': -1 } }, function(err, coupons) {
        var couponList = [];
        for (var i = 0; i < coupons.length; i++) {
            couponList.push(coupons[i].couponId);
        }
        res.render('user/lottery', {
            couponList: couponList
        });
    });
});

router.get('/sendcoupon/:couponId', function(req, res, next) {
    var couponId = req.params.couponId;
    if (couponId === 'undefined') return res.status(404).end();
    Coupon.findOne({ 'couponId': couponId }, function(err, coupon) {
        if (!coupon) return res.status(404).end();
        coupon.read = true;
        if (!coupon.readTime)
            coupon.readTime = Date.now();
        coupon.save(function(err) {
            if (err) return debug(JSON.stringify(err));
            templateSendler(coupon.userId, function() {
                res.status(200).json({
                    couponId: couponId,
                    isWin: coupon.isWin,
                    prizeType: coupon.prizeType,
                    prizeName: coupon.prizeName,
                });
            }, coupon.isWin, couponId, coupon.prizeType, coupon.prizeName);
        });
    });
});

router.get('/coupons/:userId', function(req, res, next) {
    var userId = req.params.userId;
    if (userId === 'undefined') return res.status(404).end();
    var prizeList;
    fs.readFile("./config/prize.json", 'utf8', function(err, data) {
        if (err) throw err;
        prizeList = JSON.parse(data);
        Coupon.find({ 'userId': userId, 'isWin': true, 'read': true }, {}, { sort: { 'logTime': -1 } }, function(err, coupons) {
            renderList = [];
            for (var i = 0; i < coupons.length; i++) {
                renderList.push({
                    used: (coupons[i].exchanged ? "used" : "unused"),
                    couponeId: "#" + coupons[i].couponId,
                    picSrc: "/getImg/prize/" + coupons[i].prizeType,
                    name: coupons[i].prizeName,
                    sponsor: prizeList[coupons[i].prizeType].sponsor
                });
            }
            var isEmpty = (renderList.length == 0) ? true : false;
            res.render('user/coupons', { userId: userId, select: -1, list: renderList, isEmpty: isEmpty });
        });
    });
});

router.get('/coupons/:userId/:couponId', function(req, res, next) {
    var couponId = req.params.couponId;
    var userId = req.params.userId;
    if (couponId === 'undefined') return res.status(404).end();
    if (userId === 'undefined') return res.status(404).end();
    couponId = parseInt(couponId);
    var prizeList;
    fs.readFile("./config/prize.json", 'utf8', function(err, data) {
        if (err) throw err;
        prizeList = JSON.parse(data);
        Coupon.find({ 'userId': userId, 'isWin': true, 'read': true }, {}, { sort: { 'logTime': -1 } }, function(err, coupons) {
            renderList = [];
            var found = false;
            for (var i = 0; i < coupons.length; i++) {
                if (coupons[i].couponId === couponId) found = true;
                renderList.push({
                    used: (coupons[i].exchanged ? "used" : "unused"),
                    couponeId: "#" + coupons[i].couponId,
                    picSrc: "/getImg/prize/" + coupons[i].prizeType,
                    name: coupons[i].prizeName,
                    sponsor: prizeList[coupons[i].prizeType].sponsor
                });
            }
            console.log(found)
            if (!found) return res.status(404).end();
            res.render('user/coupons', { userId: userId, select: couponId, list: renderList });
        });
    });
});

router.post('/exchange/:couponId', function(req, res, next) {
    var couponId = req.params.couponId;
    if (couponId === 'undefined') return res.status(404).end();
    Coupon.findOne({ 'couponId': couponId, 'read': true, 'isWin': true }, function(err, coupon) {
        if (!coupon) return res.status(404).end();
        if (coupon.exchanged === false) {
            coupon.exchanged = true;
            coupon.exchangedTime = Date.now();
            coupon.save((err) => {
                if (err) return debug(JSON.stringify(err));
                // res.render('exchange', {
                //     couponId: couponId,
                //     type: coupon.prizeType,
                //     couponContent: coupon.prizeName
                // });
                res.status(200).end();
            });
        } else {
            res.status(404).end();
            // res.render('hasExchange', {
            //     couponId: couponId,
            //     type: coupon.prizeType,
            //     couponContent: coupon.prizeName
            // });
        }
    });
});

recordRouter.get('/', function(req, res, next) {
    var prizeList;
    fs.readFile("./config/prize.json", 'utf8', function(err, data) {
        if (err) throw err;
        prizeList = JSON.parse(data);
        prizeList['Z'] = {
            amount: 0,
            name: '獎品已全數發出'
        };
        Coupon.find({}, {}, { sort: { 'prizeType': 1, 'logTime': -1 } }, function(err, coupons) {
            var resultList = [];
            var prizeArr = [];
            var dateArr = [];
            var keys = Object.keys(prizeList);
            var tmpLogTime;
            for (var i = 0; i < coupons.length; i++) {
                if (coupons[i].isWin || coupons[i].prizeType === 'N') {
                    tmpLogTime = new Date(coupons[i].logTime);
                    resultList.push({
                        type: coupons[i].prizeType,
                        name: coupons[i].userName,
                        id: coupons[i].couponId,
                        logTime: tmpLogTime.getTime(),
                        getTime: coupons[i].readTime,
                        exchangedTime: coupons[i].exchangedTime
                    });
                    prizeList[coupons[i].prizeType].gotPrizeAmount =
                        (prizeList[coupons[i].prizeType].gotPrizeAmount ? (prizeList[coupons[i].prizeType].gotPrizeAmount + 1) : 1);
                    if (coupons[i].exchanged)
                        prizeList[coupons[i].prizeType].exchangedAmount =
                        (prizeList[coupons[i].prizeType].exchangedAmount ? (prizeList[coupons[i].prizeType].exchangedAmount + 1) : 1);
                    if (dateArr.indexOf(coupons[i].logTime.getDate()) < 0)
                        dateArr.push(coupons[i].logTime.getDate())
                }
                prizeList[coupons[i].prizeType].amount++;
                prizeList[coupons[i].prizeType].giveoutAmount =
                    (prizeList[coupons[i].prizeType].giveoutAmount ? (prizeList[coupons[i].prizeType].giveoutAmount + 1) : 1);
            }
            for (var i in keys) {
                prizeArr.push({
                    type: keys[i],
                    name: prizeList[keys[i]].name,
                    amount: prizeList[keys[i]].amount,
                    gotPrizeAmount: prizeList[keys[i]].gotPrizeAmount || 0,
                    giveoutAmount: prizeList[keys[i]].giveoutAmount || 0,
                    exchangedAmount: prizeList[keys[i]].exchangedAmount || 0,
                    odds: Math.floor(prizeList[keys[i]].gotPrizeAmount / prizeList[keys[i]].giveoutAmount * 100) || 0
                });
            }
            res.render('manager/lotteryRecord', {
                dateArr: dateArr,
                prizeArr: prizeArr,
                resultList: resultList
            });
        });
    });
});

module.exports = {
    router: router,
    record: recordRouter
};