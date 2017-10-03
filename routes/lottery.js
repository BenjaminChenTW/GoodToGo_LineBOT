var express = require('express');
var router = express.Router();
var debug = require('debug')('goodtogo-linebot:lottery');

var Coupon = require('../models/DB/couponDB.js');
var templateSendler = require('../models/messageProcess.js').templateSendler;

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
    Coupon.findOne({ 'couponId': couponId, 'read': false }, function(err, coupon) {
        if (!coupon) return res.status(404).end();
        coupon.read = true;
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

router.get('/exchange/:couponId', function(req, res, next) {
    var couponId = req.params.couponId;
    if (couponId === 'undefined') return next();
    Coupon.findOne({ 'couponId': couponId, 'read': true, 'isWin': true }, function(err, coupon) {
        if (!coupon) return next();
        res.render('exchange', {
            couponId: couponId,
            type: coupon.prizeType,
            couponContent: coupon.prizeName
        });
    });
});

module.exports = router;