var express = require('express');
var router = express.Router();

var getImageList = require('../models/imgProcess.js').getImageList;

router.get('/', function(req, res, next) {
    res.render('checkedList');
});

router.get('/:index', function(req, res, next) {
    var index = req.params.index;
    getImageList(index, true, next, function(list) {
        res.json({ 'list': list });
    });
});

module.exports = router;