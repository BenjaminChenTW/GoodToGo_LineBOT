var express = require('express');
var router = express.Router();
var webshot = require('webshot');
var debug = require('debug')('goodtogo-linebot:usage');

router.get('/', function(req, res, next) {
    var fromLine = false;
    if (typeof req.headers['X-Requested-With'] !== 'undefined' && req.headers['X-Requested-With'].indexOf('line') >= 0) fromLine = true;
    var renderObj = {
        amount: 0,
        couponList: []
    };
    if (fromLine) {
        res.render('usage', renderObj, function(err, html) {
            if (err) return debug(JSON.stringify(err));
            var photoStream;
            webshot(html, photoStream, { siteType: 'html', windowSize: { width: 585, height: 1040 } }, function(err) {
                if (err) return debug(JSON.stringify(err));
                res.set('Content-Type', 'image/png');
                renderStream.on('data', function(data) {
                    res.write(data.toString('binary'), 'binary');
                    res.end(null, 'binary');
                });
            });
        });
    } else {
        res.render('usage', renderObj);
    }
});

router.get('/:id', function(req, res, next) {
    var userId = req.params.id;
    var fromLine = false;
    if (typeof req.headers['X-Requested-With'] !== 'undefined' && req.headers['X-Requested-With'].indexOf('line') >= 0) fromLine = true;
    var renderObj = {
        amount: 0,
        couponList: []
    };
    if (fromLine) {
        res.render('usage', renderObj, function(err, html) {
            if (err) return debug(JSON.stringify(err));
            var photoStream;
            webshot(html, photoStream, { siteType: 'html', windowSize: { width: 585, height: 1040 } }, function(err) {
                if (err) return debug(JSON.stringify(err));
                res.set('Content-Type', 'image/png');
                renderStream.on('data', function(data) {
                    res.write(data.toString('binary'), 'binary');
                    res.end(null, 'binary');
                });
            });
        });
    } else {
        res.render('usage', renderObj);
    }
});

module.exports = router;