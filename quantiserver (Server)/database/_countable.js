var mongoose = require('mongoose');

var CountableSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    count: { type: Number, required: true },
    date: {
        start: { type: Date },
        end: { type: Date }
    }
});

module.exports = CountableSchema;
