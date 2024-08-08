const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const keySchema = new Schema({
    apiKey: {
        type: String,
        required: true
    }
})

module.exports = mongoose.model('Key', keySchema);