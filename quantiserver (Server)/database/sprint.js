var mongoose = require('mongoose');

var Cohesion = require('./cohesion');

var DateUtils = require('../util/date');

var SprintSchema = new mongoose.Schema({
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    date: {
        start: { type: Date, required: true },
        end: { type: Date, required: true }
    }
});

SprintSchema.methods.getCohesionReports = function(cb) {
    Cohesion.find({ sprint: this }).populate('owner').exec(function(err, reports) {
        cb(err, reports);
    });
};

SprintSchema.methods.getCohesionReportForUser = function(user, cb) {
    Cohesion.findOne({ sprint: this, owner: user }, function(err, report) {
        cb(err, report);
    });
};

SprintSchema.methods.getCohesionScore = function(cb) {
    this.getCohesionReports(function(err, reports) {
        var total = 0;

        var task = 0;
        var social = 0;
        var attractiveness = 0;

        reports.forEach(function(r) {
            var sc = r.score();

            total += sc.total;

            task += sc.task;
            social += sc.social;
            attractiveness += sc.attractiveness;
        });

        cb({
            total: total / reports.length,
            task: task / reports.length,
            social: social / reports.length,
            attractiveness: attractiveness / reports.length
        });
    });
};

SprintSchema.methods.dateYMD = function() {
    return {
        start: DateUtils.toDateYMD(this.date.start),
        end: DateUtils.toDateYMD(this.date.end)
    }
};

module.exports = mongoose.model('Sprint', SprintSchema);