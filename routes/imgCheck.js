var express = require('express');
var router = express.Router();

var getInitList = require('../models/imgProcess.js').getInitList;
var getImageList = require('../models/imgProcess.js').getImageList;

router.get('/', function(req, res, next) {
    getInitList(getImageList, next, function(lastIndex, list) {
        res.render('checkimg/index', {
            'lastIndex': lastIndex,
            'list': list
        });
    });
});

router.get('/:id', function(req, res, next) {
    var id = req.params.id;
    getImageList(id, next, function(list) {
        res.json({ 'list': list });
    });
});

module.exports = router;