var mongoose = require('mongoose');

// define the schema for our user model
var schema = mongoose.Schema({
    event: Object,
    notify: Boolean,
    img: {
        id: Number,
        hash: String,
        data: Buffer,
        contentType: String,
        checked: Boolean,
        checkStatus: {
            typeCode: Number,
            reason: String,
            amount: {
                container: Number,
                bag: Number,
                tableware: Number
            },
            checkTime: Number
        }
    },
    read: { type: Boolean, default: false },
    logTime: { type: Date, default: Date.now }
});

schema.index({ "logTime": -1, "img.id": 1 });

// create the model for users and expose it to our app
module.exports = mongoose.model('Message', schema);