"use strict";

const express = require('express');
const app = express();
const nunjucks = require('nunjucks');
const server = require('http').Server(app);
const io = require('socket.io')(server, {serveClient: true});
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const passport = require('passport');
const { Strategy } = require('passport-jwt');

// /далі підключаємо паспорт і стратегію до проекта
const { jwt } = require('./config');

passport.use(new Strategy(jwt, function(jwt_payload, done) {
    if(jwt_payload != void(0)) return done(false, jwt_payload);
    done();
}));

//підключення до БД
mongoose.connect('mongodb://localhost:27017/chatik', { useNewUrlParser: true });
mongoose.Promise = require('bluebird');
// mongoose.set('debug', true);

//конфігурація шаблонізатора nunjucks
nunjucks.configure('./client/view', {
    autoescape: true,
    express: app
});

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

//підключаємо cookieParser
app.use(cookieParser());

require('./router')(app);

require('./sockets')(io);

server.listen(3013, 'localhost',  () => {
    console.log('Server started on port: 3013')
});

