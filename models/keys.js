const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const keySchema = new Schema({
    sendgridKey: {
        type: String,
        required: true
    },
    stripeKey: {
        type: String,
        required: true
    }
})

module.exports = mongoose.model('Key', keySchema);