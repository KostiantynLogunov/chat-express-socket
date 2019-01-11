"use strict";
const cookieParser = require('cookie-parser');
const MessageModel = require('./models/messages.model');
var cookie_reader = require('cookie');

module.exports = (io) => {

    io.on('connection', function (socket) {
        socket.emit('connected', "You are connected!");

        socket.join('all');

        socket.on('msg', content => {
            let username = cookie_reader.parse(socket.handshake.headers.cookie).username;

            const obj = {
                date: new Date(),
                content: content,
                username: username
            };

            MessageModel.create(obj, err=>{
                if (err) return console.error("MessageModel: ", err);

                socket.emit('message', obj);
                socket.to('all').emit("message", obj); //ідправити всім іншим
            });
        });
        socket.on('receiveHistory', () => {
            MessageModel
                .find({})
                .sort({date: -1})
                .limit(50)
                .sort({date: 1})
                .lean()
                .exec((err, messages) => {
                    // if (err) return console.error(err);
                    if (!err) {
                        socket.emit('history', messages);
                    }
                })
        });//lean() - повертає лише обєкти без привязки до мангуса
    });
};