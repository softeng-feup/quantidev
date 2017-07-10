var mongoose = require('mongoose');

var TimeLogSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: {
        start: { type: Date },
        end: { type: Date }
    }
});

module.exports = TimeLogSchema;
