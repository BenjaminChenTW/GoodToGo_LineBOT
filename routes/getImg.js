var express = require('express');
var router = express.Router();
var fs = require('fs');

var Message = require('../models/DB/messageDB.js');

router.get('/:id', function(req, res, next) {
    var index = req.params.id;
    process.nextTick(function() {
        Message.findOne({ 'img.id': index }, 'img.contentType img.data', function(err, img) {
            if (!img) return res.status(404).end();
            res.set('Content-Type', img.img.contentType);
            res.set('Cache-Control', 'public, max-age=' + 1000 * 60);
            res.write(img.img.data, 'binary');
            res.end(null, 'binary');
        });
    });
});

module.exports = router;