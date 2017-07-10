var mongoose = require('mongoose');

var WeatherSchema = new mongoose.Schema({
    location: String,
    condition: Number,
    date: Date
});

module.exports = mongoose.model('Weather', WeatherSchema);