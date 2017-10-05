var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var debug = require('debug')('goodtogo-linebot:app');
debug.log = console.log.bind(console);

var debugServer = require('debug')('goodtogo-linebot:server');
var http = require('http');
const line = require('@line/bot-sdk');
const JSONParseError = require('@line/bot-sdk/exceptions').JSONParseError;
const SignatureValidationFailed = require('@line/bot-sdk/exceptions').SignatureValidationFailed;
var basicAuth = require('basic-auth-connect');
var compression = require('compression');
var mongoose = require('mongoose');
const EventEmitter = require('events');

var bot = require('./routes/bot.js').handleEvent;
var imgCheck = require('./routes/imgCheck');
var checkedList = require('./routes/checkedList');
var chatroom = require('./routes/chatroom');
var lottery = require('./routes/lottery');
var getImg = require('./routes/getImg');
var usage = require('./routes/usage');
var discount = require('./routes/discount');
var config = require('./config/config.js');

/**
 * DB init
 */
mongoose.Promise = global.Promise;
mongoose.connect(config.dbUrl, config.dbOptions, function(err) {
    if (err) throw (err);
    debug('mongoDB connect succeed');
});
/**
 * EXPRESS init
 */
var app = express();
app.use(logger('dev'));
app.disable('x-powered-by');
var authMiddleWare = basicAuth(config.auth.user, config.auth.pwd);

/**
 * Get port from environment and store in Express.
 */
var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

/**
 * Create HTTP server.
 */
var server = http.createServer(app);

/**
 * Socket Event init
 */
var io = require('socket.io')(server);
var chat = io.of('/chatroom');
global.aEvent = new EventEmitter();
global.aEvent.on('getMsg', function(userId, userName, imgUrl, msg, type) {
    chatroom.getMsg(chat, userId, userName, imgUrl, msg, type);
});
chat
    .on('connection', function(socket) {
        socket.emit('server', { msg: "Login Success" });
        socket.on('sendMsg', function(obj) {
            chatroom.sendMsg(socket, obj.userId, obj.msg)
        });
    });
var checkingImg = io.of('/img');
global.imgEvent = new EventEmitter();
global.imgEvent.on('addImg', function(index) {
    imgCheck.addEvent(checkingImg, index);
});
global.imgEvent.on('popImg', function(index) {
    imgCheck.popEvent(checkingImg, index);
});
checkingImg
    .on('connection', function(socket) {
        socket.emit('server', { msg: "Login Success" });
    });

/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

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
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(compression());
app.use(favicon(path.join(__dirname, 'views/assets', 'favicon.ico')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use('/assets', express.static(path.join(__dirname, 'views/assets')));

/**
 * Status Monitir init
 */
var esm = require('express-status-monitor')({ title: "GoodToGo LineBot Monitor", path: '', websocket: io });
app.use(esm.middleware);
app.get('/status', authMiddleWare, esm.pageRoute);

/**
 * WEB router
 */
app.use('/lottery', lottery.router);
app.use('/getImg', getImg);
app.use('/usage', usage);
app.use('/discount', discount);
app.use(authMiddleWare);
app.use(session({
    secret: 'a secret string',
    cookie: {
        path: '/chatroom',
        secure: false
    },
    resave: false,
    saveUninitialized: false
}));
app.use('/img', imgCheck.router);
app.use('/checkedList', checkedList);
app.use('/chatroom', chatroom.router);
app.use('/lotteryRecord', lottery.record);
app.use('/', function(req, res) { res.redirect('/img'); });

/**
 * Error handle
 */
// catch 404 and forward to error handler
app.use(function(req, res, next) {
    if (req.url.indexOf('/status') >= 0) { return next(); }
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
    if (err.status !== 404) {
        debug(res.locals.message);
        debug(res.locals.error);
    }

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;

/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val) {
    var port = parseInt(val, 10);
    if (isNaN(port)) {
        // named pipe
        return val;
    }
    if (port >= 0) {
        // port number
        return port;
    }
    return false;
}

/**
 * Event listener for HTTP server "error" event.
 */
function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }
    var bind = typeof port === 'string' ?
        'Pipe ' + port :
        'Port ' + port;
    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

/**
 * Event listener for HTTP server "listening" event.
 */
function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string' ?
        'pipe ' + addr :
        'port ' + addr.port;
    debugServer('Listening on ' + bind);
}