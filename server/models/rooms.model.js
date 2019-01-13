"use strict";

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RoomSchema = new Schema(
    {
        name: {type: String},
        user1_id: {type: String},
        user2_id: {type: String},
    },
    {
        versionKey: false,
        collection: "RoomsCollection"
    }
);

module.exports = mongoose.model('RoomModel', RoomSchema);