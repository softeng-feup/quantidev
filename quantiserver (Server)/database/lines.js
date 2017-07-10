var mongoose = require('mongoose');

var countable = require('./_countable');

module.exports = mongoose.model('Lines', countable);
