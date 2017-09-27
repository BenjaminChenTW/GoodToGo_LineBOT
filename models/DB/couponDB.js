var mongoose = require('mongoose');

// define the schema for our user model
var schema = mongoose.Schema({
    userId: String,
    couponId: String,
    picIndex: Number,
    prizeType: String,
    prizeName: String,
    isWin: Boolean,
    exchanged: { type: Boolean, default: false },
    logTime: { type: Date, default: Date.now }
});

schema.index({ "logTime": -1 });

// create the model for users and expose it to our app
module.exports = mongoose.model('Coupon', schema);