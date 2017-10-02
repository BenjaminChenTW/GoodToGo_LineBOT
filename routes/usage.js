var express = require('express');
var router = express.Router();
var debug = require('debug')('goodtogo-linebot:usage');

var count = require('../models/usageProcess.js')

router.get('/', function(req, res, next) {
    count('', function(renderObj) {
        res.render('', renderObj);
    });
});

router.get('/:id', function(req, res, next) {
    var userId = req.params.id;
    count(userId, function(renderObj) {
        res.render('', renderObj);
    });
});

module.exports = router;