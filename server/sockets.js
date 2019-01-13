"use strict";
const cookieParser = require('cookie-parser');
const MessageModel = require('./models/messages.model');
const RoomModel = require('./models/rooms.model');
var cookie_reader = require('cookie');

module.exports = (io) => {

    io.on('connection', function (socket) {
        socket.emit('connected', "You are connected!");
        // console.log(Object.keys(socket.rooms));
        socket.join('all');

        socket.on('msg', content => {
            let username = cookie_reader.parse(socket.handshake.headers.cookie).username;

            const obj = {
                date: new Date(),
                content: content,
                username: username,
                client: cookie_reader.parse(socket.handshake.headers.cookie).username
            };

            MessageModel.create(obj, err=>{
                if (err) return console.error("MessageModel: ", err);

                socket.emit('message', obj);
                obj.client = null;
                socket.to('all').emit("message", obj); //Bідправити всім іншим
            });
        });
        socket.on('receiveHistory', () => {
            MessageModel
                .where('room_name').equals('all')
                .find({})
                .sort({date: -1})
                .limit(50)
                .sort({date: 1})
                .lean()
                .exec((err, messages) => {
                    // if (err) return console.error(err);
                    if (!err) {
                        socket.emit('history', {messages: messages, client: cookie_reader.parse(socket.handshake.headers.cookie).username});
                    }
                })
        });//lean() - повертає лише обєкти без привязки до мангуса
    });

    io.of('/private').on('connection', function (socket) {
        socket.emit('connected', "You are connected to PRIVATE CHAT!");

        socket.on('disconnectPrivate', () => {
            let rooms = Object.keys(socket.rooms);
            let room = rooms[1];
            socket.leave(room);
            // console.log("Disconnect from room: ", room);
        });

        socket.on('chooseContact', choosed_contact_id =>{
            let my_client_id = cookie_reader.parse(socket.handshake.headers.cookie).id;
           // console.log('I want to chat with: ', choosed_contact_id);
           // console.log('I am ', my_client_id);
            let rooms = Object.keys(socket.rooms);
            let room = rooms[1];
            socket.leave(room);
            // console.log("Disconnect from room: ", room);

            RoomModel.find({
                $or: [
                    { $and: [{user1_id: my_client_id}, {user2_id: choosed_contact_id}] },
                    { $and: [{user1_id: choosed_contact_id}, {user2_id: my_client_id}] }
                ]
            }, function (err, results) {
                if (err) console.log('Error in finding rooms: ', err);
                // console.log(results.length);
                // console.log(my_client_id + '_' + choosed_contact_id);

                if (results.length > 0) {
                    var roomName = results[0].name;
                    // console.log('Rooms name: '+ roomName);

                    MessageModel
                        .where('room_name').equals(roomName)
                        .find({})
                        .sort({date: -1})
                        .limit(50)
                        .sort({date: 1})
                        .lean()
                        .exec((err, messages) => {

                            socket.join(roomName);
                            if (err) throw err;

                            if (!err && messages.length>0) {
                                socket.emit('privateHistory', {messages: messages, client: cookie_reader.parse(socket.handshake.headers.cookie).username});
                            }
                        });

                    socket.join(roomName);

                } else {
                    const room_name = my_client_id + '_' + choosed_contact_id;
                    const someRoom = {
                        name: room_name,
                        user1_id: my_client_id,
                        user2_id: choosed_contact_id,
                    };

                    RoomModel.create(someRoom, err=>{
                        if (err) {
                            console.error("RoomModel: ", err);
                            throw err;
                        }
                    });
                    console.log('joining room: ', room_name);
                    socket.join(room_name);
                }

            });
        });

        socket.on('private_msg', content => {
            let username = cookie_reader.parse(socket.handshake.headers.cookie).username;
            let rooms = Object.keys(socket.rooms);
            let room = rooms[1];
            const obj = {
                room_name: room,
                date: new Date(),
                content: content,
                username: username,
                client: cookie_reader.parse(socket.handshake.headers.cookie).username
            };

            MessageModel.create(obj, err=>{
                if (err) return console.error("MessageModel: ", err);

                socket.emit('privateMessage', obj);
                obj.client = null;
                socket.to(room).emit("privateMessage", obj); //Bідправити всім іншим
            });
        });
    });
};