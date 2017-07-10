var schedule = require('node-schedule');

var GetData = require('./get-data');

var Team = require('../database/team');
var User = require('../database/user');
var Sprint = require('../database/sprint');

function Jobs() {
    this.jobs = [];
}

Jobs.prototype.startJobs = function() {
    var _this = this;

    var updateRule = new schedule.RecurrenceRule();

    updateRule.minute = 59;

    this.jobs.push(schedule.scheduleJob(updateRule, function() {
        _this.updateFromExternalServices();
    }));

    var updateSprintRule = new schedule.RecurrenceRule();

    updateRule.hour = 0;
    updateRule.minute = 1;

    this.jobs.push(schedule.scheduleJob(updateSprintRule, function() {
        _this.updateSprint();
    }));

    this.updateFromExternalServices();
    this.updateSprint();
};

Jobs.prototype.stopJobs = function() {
    this.jobs.forEach(function(j) {
        j.cancel();
    });

    this.jobs = [];
};

Jobs.prototype.updateFromExternalServices = function() {
    User.find({}, function(err, users) {
        users.forEach(function(u) {
            try {
                var gd = new GetData(u);

                gd.get();
            } catch (e) {
                //  Ignore...
            }
        });
    });
};

function createSprint(t, st, ed) {
    var s = new Sprint({
        team: t,
        date: {
            start: st,
            end: ed
        }
    });

    s.save(function(err, newSprint) {
        if (err)
            console.log("Unable to save sprint!");
    });
}

Jobs.prototype.updateSprint = function() {
    Team.find({}, function(err, teams) {
        teams.forEach(function(t) {
            Sprint.find({ team: t }).sort('-date.end').exec(function(err, sprints) {
                var now = new Date(Date.now());

                if (sprints && sprints.length) {
                    now.setDate(now.getDate() - t.sprints.length);

                    var last = sprints[0];

                    if (last.date.end < now) {
                        var st = last.date.end;
                        var ed = new Date(st.getTime());

                        ed.setDate(ed.getDate() + t.sprints.length);

                        createSprint(t, st, ed);
                    }
                } else {
                    if (t.sprints && t.sprints.length && t.sprints.start) {
                        var begin = new Date(t.sprints.start);
                        var end = new Date(t.sprints.start);

                        end.setDate(end.getDate() + t.sprints.length);

                        var last = t.sprints.start;

                        last.setDate(last.getDate() + t.sprints.length);

                        if (last < now) {
                            createSprint(t, begin, end);
                        }
                    }
                }
            });
        });
    });
};

module.exports = (new Jobs());