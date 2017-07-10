var mongoose = require('mongoose');

var CommunicationSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    rating: { type: Number, required: true },
    date: { type: Date, required: true }
});

module.exports = mongoose.model('Communication', CommunicationSchema);;
