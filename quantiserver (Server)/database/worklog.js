var mongoose = require('mongoose');

var COORD_PRECISION = 200;

var geolib = require('geolib');

var WorklogSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: {
        start: Date,
        end: Date
    },
    location: {
        latitude: Number,
        longitude: Number
    }
});

WorklogSchema.methods.getSeconds = function() {
    var lowerDate = this.date.start;
    var upperDate = this.date.end;

    if (!upperDate)
        upperDate = Date.now();

    var diff = upperDate - lowerDate;

    return (diff / 1000);     //  Return seconds.
};

WorklogSchema.methods.isInWorkplace = function(workplaceCoordinates) {
    try {
        return geolib.isPointInCircle(
            { latitude: this.location.latitude, longitude: this.location.longitude },
            workplaceCoordinates,
            COORD_PRECISION
        );
    } catch (e) {
        return false;
    }
};

module.exports = mongoose.model('WorkLog', WorklogSchema);
