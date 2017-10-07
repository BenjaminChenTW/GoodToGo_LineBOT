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

router.get('/msg/:id/:res', function(req, res, next) {
    var index = req.params.id;
    fs.readFile("./views/assets/image/" + index.slice(0, index.length - 1) + ".jpg", function(err, data) {
        if (err) {
            console.log(err)
            res.status(404).end();
        } else {
            res.set('Cache-Control', 'public, max-age=0');
            res.write(data, 'binary');
            res.end(null, 'binary');
        }
    });
});

router.get('/poster/:id', function(req, res, next) {
    var index = req.params.id;
    fs.readFile("./views/assets/image/" + index + ".png", 'base64', function(err, data) {
        if (err) {
            res.status(404).end();
        } else {
            var title;
            switch (index) {
                case 'discount':
                    title = '環保容器優惠與使用說明';
                    break;
                case 'rule':
                    title = '抽獎活動說明';
                    break;
                case 'rent':
                    title = '容器租借方法說明';
                    break;
            }
            res.set({ 'content-type': 'text/html', 'charset': 'utf-8' });
            res.end(
                "<head><title>" + title + "</title></head>" +
                "<body style='margin: 0 0 0 0;'>" +
                "<img src='data:image/jpg;base64," + data + "' style='width: 100%;' />" +
                "</body>"
            );
        }
    });
});

router.get('/:id', function(req, res, next) {
    var index = req.params.id;
    process.nextTick(function() {
        Message.findOne({ 'img.id': index }, 'img.contentType img.data', function(err, img) {
            if (!img) return res.status(404).end();
            res.set('Content-Type', img.img.contentType);
            res.set('Cache-Control', 'public, max-age=' + 60 * 60 * 3);
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