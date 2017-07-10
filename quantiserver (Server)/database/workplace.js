var mongoose = require('mongoose');

var WorkplaceSchema = new mongoose.Schema({
    latitude: Number,
    longitude: Number,
    identifier: String
});

module.exports = mongoose.model('Workplace', WorkplaceSchema);