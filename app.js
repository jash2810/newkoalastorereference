var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var flash = require('connect-flash');
var busboy = require('then-busboy');
var fileUpload = require('express-fileupload');
global.window = new Object();
const mongodb = require('mongodb');
const mongoose = require('mongoose');
var passportSetup = require('./config/passport-setup');
var passport = require('passport');
const keys = require('./config/keys');
//mongodb://heroku_vsht1rk3:7qfotlmj2ba7o2nn6j4qq21fto@ds141942.mlab.com:41942/heroku_vsht1rk3
mongoose.connect(keys.mongoose.dbURL, () => {
	console.log('connected to database');
});

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var loginRouter = require('./routes/login');
var adminRouter = require('./routes/admin');
var uiRouter = require('./routes/ui');
var authRouter = require('./routes/auth');
var generalRouter = require('./routes/general');
var app = express();

// passport
app.use(passport.initialize());
app.use(passport.session());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({ secret: 'thisisrandomstringofkoalastore', cookie: { maxAge: 3*24*60*60*1000 }}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(flash());
app.use(fileUpload());
// app..listen(PORT, () => console.log(`Listening on ${ PORT }`))

//Express Message Middleware
app.use(require('connect-flash')());
app.use(function (req, res, next) {
	res.locals.messages = require('express-messages')(req, res);
	next();
});

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/login', loginRouter);
app.use('/admin', adminRouter);
app.use('/ui', uiRouter);
app.use('/auth', authRouter);
app.use('/general', generalRouter);
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
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
