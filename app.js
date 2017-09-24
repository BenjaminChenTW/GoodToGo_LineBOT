var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var debug = require('debug')('goodtogo-linebot:app');
debug.log = console.log.bind(console);

const line = require('@line/bot-sdk');
const JSONParseError = require('@line/bot-sdk/exceptions').JSONParseError;
const SignatureValidationFailed = require('@line/bot-sdk/exceptions').SignatureValidationFailed;
var basicAuth = require('basic-auth-connect');
var mongoose = require('mongoose');
var Server = require('http').Server;

var bot = require('./routes/bot.js').handleEvent;
var index = require('./routes/index');
// var imgCheck = require('./routes/imgCheck');
var chatroom = require('./routes/chatroom');
var config = require('./config/config.js');

/**
 * DB init
 */
mongoose.Promise = global.Promise;
mongoose.connect(config.dbUrl, config.dbOptions, function(err) {
    if (err) next(err);
    debug('mongoDB connect succeed');
});

/**
 * EXPRESS init
 */
var app = express();
app.use(logger('dev'));

/**
 * BOT router
 */
app.post('/webhook', line.middleware(config.bot), (req, res) => {
    Promise
        .all(req.body.events.map(bot))
        .then((result) => res.json(result));
});

/**
 * WEB init
 */
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
// app.use(cookieParser());
app.use(basicAuth(config.auth.user, config.auth.pwd));
app.use(require('express-status-monitor')({ title: "GoodToGo LineBot Monitor" }));

/**
 * CHAT ROOM init
 */
// var server = Server(app);
// var io = require('socket.io')(server);

/**
 * WEB router
 */
app.use('/', index);
// app.use('/img', imgCheck);
app.use('/chatroom', chatroom);

/**
 * Error handle
 */
// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});
// line bot error handler
app.use((err, req, res, next) => {
    if (err instanceof SignatureValidationFailed) {
        res.status(401).send(err.signature);
        return;
    } else if (err instanceof JSONParseError) {
        res.status(400).send(err.raw);
        return;
    }
    next(err); // will throw default 500
});
// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    debug(res.locals.message);
    // debug(res.locals.error);

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;