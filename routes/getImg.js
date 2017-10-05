var express = require('express');
var router = express.Router();
var fs = require('fs');

var Message = require('../models/DB/messageDB.js');

var fs = require('fs');
var prizeList;
fs.readFile("./config/prize.json", 'utf8', function(err, data) {
    if (err) throw err;
    prizeList = JSON.parse(data);
});

router.get('/discount', function(req, res, next) { res.status(200).end() });

router.get('/rule', function(req, res, next) { res.end() });

router.get('/rent', function(req, res, next) { res.end() });

router.get('/:id', function(req, res, next) {
    var index = req.params.id;
    process.nextTick(function() {
        Message.findOne({ 'img.id': index }, 'img.contentType img.data', function(err, img) {
            if (!img) return res.status(404).end();
            res.set('Content-Type', img.img.contentType);
            res.set('Cache-Control', 'public, max-age=' + 60 * 60);
            res.write(img.img.data, 'binary');
            res.end(null, 'binary');
        });
    });
});

router.get('/prize/:id', function(req, res, next) {
    var index = req.params.id;
    fs.readFile("./views/assets/image/" + index + ".png", function(err, data) {
        if (err) {
            fs.readFile("./views/assets/image/go.png", function(err, data) {
                res.write(data, 'binary');
                res.end(null, 'binary');
            });
        } else {
            res.write(data, 'binary');
            res.end(null, 'binary');
        }
    });
});

module.exports = router;