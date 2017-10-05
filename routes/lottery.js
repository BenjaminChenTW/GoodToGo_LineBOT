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
    Coupon.find({ 'userId': id, 'read': false }, function(err, coupons) {
        var couponList = [];
        for (var i = 0; i < coupons.length; i++) {
            couponList.push({
                id: coupons[i].couponId,
                refImgIndex: picIndex
            });
        }
        res.render('draw', {
            amount: coupons.length,
            couponList: couponList
        });
    });
});

router.get('/sendcoupon/:couponId', function(req, res, next) {
    var couponId = req.params.couponId;
    if (couponId === 'undefined') return res.status(404).end();
    console.log(couponId)
    Coupon.findOne({ 'couponId': couponId }, function(err, coupon) {
        console.log(err)
        console.log(coupon)
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

router.get('/myCoupons/:userId', function(req, res, next) {
    var userId = req.params.userId;
    if (userId === 'undefined') return res.status(404).end();
    var prizeList;
    fs.readFile("./config/prize.json", 'utf8', function(err, data) {
        if (err) throw err;
        prizeList = JSON.parse(data);
    });
    Coupon.find({ 'userId': userId }, {}, { sort: { 'couponId': 1 } }, function(err, coupons) {
        renderList = [];
        for (var i = 0; i < coupons.length; i++) {
            renderList.push({
                used: (coupons[i].exchanged ? "used" : "unused"),
                couponeId: "#" + coupons[i].couponId,
                picSrc: "/getImg/prize/" + coupons[i].prizeType,
                name: coupons[i].prizeName,
                sponser: prizeList[coupons[i].prizeType].sponser
            });
        }
        res.render('coupons', { list: renderList });
    });
});

router.get('/exchange/:couponId', function(req, res, next) {
    var couponId = req.params.couponId;
    if (couponId === 'undefined') return next();
    Coupon.findOne({ 'couponId': couponId, 'read': true, 'isWin': true }, function(err, coupon) {
        if (!coupon) return res.status(404).end();
        if (exchanged === false) {
            coupon.exchanged = true;
            coupon.exchangedTime = Date.now();
            coupon.save((err) => {
                if (err) return debug(JSON.stringify(err));
                res.render('exchange', {
                    couponId: couponId,
                    type: coupon.prizeType,
                    couponContent: coupon.prizeName
                });
            });
        } else {
            res.render('hasExchange', {
                couponId: couponId,
                type: coupon.prizeType,
                couponContent: coupon.prizeName
            });
        }
    });
});

recordRouter.get('/', function(req, res, next) {
    var prizeList;
    fs.readFile("./config/prize.json", 'utf8', function(err, data) {
        if (err) throw err;
        prizeList = JSON.parse(data);
    });
    Coupon.find({}, {}, { sort: { 'prizeType': 1, 'readTime': 1 } }, function(err, coupons) {
        var resultList = [];
        var prizeArr = [];
        for (var i = 0; i < coupons.length; i++) {
            // if (coupons[i].readTime)
            resultList.push({
                prizeType: coupons[i].prizeType,
                name: coupons[i].userName,
                logTime: coupons[i].logTime,
                getTime: coupons[i].readTime,
                exchangedTime: coupons[i].exchangedTime
            });
            prizeList[coupons[i].prizeType].amount++;
        }
        for (var i = 0; i < prizeList.length; i++) {
            prizeArr.push({});
        }
        res.render('lotteryRecord');
    });

});

module.exports = {
    router: router,
    record: recordRouter
};