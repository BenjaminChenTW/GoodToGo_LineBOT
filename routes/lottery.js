var express = require('express');
var router = express.Router();

var templateSendler = require('../models/messageProcess.js').templateSendler;

router.get('/draw/:id', function(req, res, next) {
    var id = req.params.id;
    // 抽獎券DB
    res.render('draw', {
        amount: 0,
        couponList: []
    });
});

router.get('/sendcoupon/:id', function(req, res, next) {
    var id = req.params.id;
    // 抽獎券DB
    templateSendler(lineUserId, couponId, couponType, couponContent, function() {
        res.status(200).json({});
    });
});

router.get('/exchange/:id', function(req, res, next) {
    var id = req.params.id;
    // 抽獎券DB set exchange
    res.render('exchange', {
        couponId: 0, // couponId
        couponContent: '' //ouponContent
    });
});

module.exports = router;