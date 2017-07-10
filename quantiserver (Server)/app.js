var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var passport = require('passport');
var cors = require('cors');

var routes = require('./routes/index');
var api = require('./routes/api');
var proxy = require('./routes/proxy');

var app = express();

var User = require('./database/user');

var Config = require('./config');
var Jobs = require('./util/jobs')

var LocalStrategy = require('passport-local').Strategy;

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors({
    exposedHeaders: [
        'Authorization',
        'Content-Type'
    ]
}));

app.use('/api', api);
app.use('/proxy', proxy);

app.use(function(req, res, next) {
    return res.send('QuantiServer/1.0');
});

//  MongoDB Setup

var db = mongoose.connection;

db.on('error', console.error);

db.once('open', function() {
    console.log("Connected to MongoDB.");
});

if (Config.mongodb)
    mongoose.connect('mongodb://' + Config.mongodb.username + ':' + Config.mongodb.password + '@' + Config.mongodb.host + '/' + Config.mongodb.database);
else
    mongoose.connect('mongodb://' + process.env.MONGO_USER + ':' + process.env.MONGO_PASSWORD + '@' + process.env.MONGO_SERVER + '/' + process.env.MONGO_DATABASE);

//  Passport Setup

passport.use(new LocalStrategy(function(username, password, cb) {
    User.findOne({ 'username': username }, function(err, u) {
        if (err)
            return cb(err);

        if (u == null)
            return cb(false);

        u.comparePassword(password, function(err, match) {
            if (err)
                throw err;

            if (match)
                return cb(null, u);

            return cb(false);
        });
    });
}));

passport.serializeUser(function(user, cb) {
    cb(null, user.id);
});

passport.deserializeUser(function(id, cb) {
    User.findById(id, function(err, u) {
        if (err)
            return cb(err);

        cb(null, u);
    });
});

Jobs.startJobs();

module.exports = app;
