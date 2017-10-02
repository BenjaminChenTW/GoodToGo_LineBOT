var express = require('express');
var router = express.Router();
var webshot = require('webshot');
var path = require('path');
var debug = require('debug')('goodtogo-linebot:usage');

var count = require('../models/usageProcess.js')

router.get('/', function(req, res, next) {
    // count('', function(renderObj) {
    //     res.render('checkedList', renderObj);
    // });
    count('', function(renderObj) {
        res.render('checkedList', renderObj, function(err, html) {
            if (err) return debug(JSON.stringify(err));
            var photoStream = webshot(html, {
                siteType: 'html',
                windowSize: { width: 1024, height: 1024 },
                defaultWhiteBackground: true,
                customCSS: path.join(__dirname, 'views/assets/css/style.css')
            });
            res.set('Content-Type', 'image/png');
            photoStream.on('data', function(data) {
                res.end(data.toString('binary'), 'binary');
            });
        });
    });
});

router.get('/preview', function(req, res, next) {
    // count('', function(renderObj) {
    //     res.render('checkedList', renderObj);
    // });
    count('', function(renderObj) {
        res.render('checkedList', renderObj, function(err, html) {
            if (err) return debug(JSON.stringify(err));
            var photoStream = webshot(html, { siteType: 'html', windowSize: { width: 240, height: 240 }, defaultWhiteBackground: true });
            res.set('Content-Type', 'image/png');
            photoStream.on('data', function(data) {
                res.end(data.toString('binary'), 'binary');
            });
        });
    });
});

router.get('/:resolution', function(req, res, next) {
    var resolution = parseInt(req.params.resolution);
    console.log(resolution)
    count('', function(renderObj) {
        res.render('checkedList', renderObj, function(err, html) {
            console.log(resolution / 16 * 9)
            if (err) return debug(JSON.stringify(err));
            console.log(resolution / 16 * 9)
            var photoStream = webshot(html, { siteType: 'html', windowSize: { width: resolution, height: (resolution / 16 * 9) } });
            res.set('Content-Type', 'image/png');
            photoStream.on('data', function(data) {
                res.end(data.toString('binary'), 'binary');
            });
        });
    });
});

router.get('/:id/:321', function(req, res, next) {
    var userId = req.params.id;
    var fromLine = false;
    if (typeof req.headers['X-Requested-With'] !== 'undefined' && req.headers['X-Requested-With'].indexOf('line') >= 0) fromLine = true;
    count(userId, function(renderObj) {
        if (fromLine) {
            res.render('chatroom', renderObj, function(err, html) {
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
            res.render('chatroom', renderObj);
        }
    });
});

module.exports = router;