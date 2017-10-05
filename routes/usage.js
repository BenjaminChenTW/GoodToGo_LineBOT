var express = require('express');
var router = express.Router();
var debug = require('debug')('goodtogo-linebot:usage');

var count = require('../models/usageProcess.js')

router.get('/:id', function(req, res, next) {
    var userId = req.params.id;
    if (userId === 'undefined') return res.status(404).end();
    count(userId, function(renderObj) {
        res.render('user/reduce', renderObj);
    });
});

module.exports = router;