var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var linebot = require('linebot');

var index = require('./routes/index');
var config = require('./config/config.js');

/**
 * BOT init and router
 */
var bot = linebot(config.bot);
bot.on('message', function(event) {});
bot.on('follow', function(event) {});
bot.on('unfollow', function(event) {});
bot.on('join', function(event) {});
bot.on('leave', function(event) {});
bot.on('postback', function(event) {});
bot.on('beacon', function(event) {});

/**
 * EXPRESS init
 */
var app = express();
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
// app.use(cookieParser());

/**
 * EXPRESS router
 */
const linebotParser = bot.parser();
app.post('/linewebhook', linebotParser);
app.use('/', index);

/**
 * EXPRESS error handle
 */
// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});
// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;