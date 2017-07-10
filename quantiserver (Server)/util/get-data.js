var _ = require('lodash');
var dateformat = require('dateformat');

var GitHub = require('../connections/github');
var Bugzilla = require('../connections/bugzilla');
var PivotalTracker = require('../connections/pivotal');

var YWeather = require('../connections/weather');

var Commits = require('../database/commits');
var Lines = require('../database/lines');
var Issues = require('../database/issues');
var StoryPoints = require('../database/storypoints');
var WorkLog = require('../database/worklog');
var Weather = require('../database/weather');

var Constants = require('../util/const');
var DateUtils = require('../util/date');

function GetData(user) {
    this.user = user;

    this.prevMidnight = new Date();
    this.prevMidnight.setHours(0, 0, 0, 0);

    this.nextMidnight = new Date();
    this.nextMidnight.setHours(23, 59, 59, 999);
}

GetData.prototype._removePastToday = function(model) {
    model.remove({
        owner: this.user,
        date: {
            start: this.prevMidnight,
            end: this.nextMidnight
        }
    }, function(err) {

    });
}

GetData.prototype.get = function() {
    var self = this;

    var lu = DateUtils.getLowerUpperBoundDate(Date.now());

    var connections = this.user.connections;

    Weather.findOne({ date: lu.lower }, function(err, result) {
        if (!err && !result) {
            if (self.user.location) {
                var location = self.user.location;

                var yw = new YWeather();

                yw.getConditionsFor(location, function(condition) {
                    var w = new Weather({
                        location: location,
                        condition: condition,
                        date: self.prevMidnight
                    });

                    w.save(function(err, newW) {
                        if (err)
                            console.log("Unable to save weather conditions!");
                    });
                });
            }
        }
    });

    if (_.has(connections, Constants.GITHUB)) {
        var gh = new GitHub();

        gh.getTodaysCommits(connections[Constants.GITHUB].username, connections[Constants.GITHUB].token, function(commits) {
            gh.getTodaysLinesOfCode(commits, function(loc) {
                self._removePastToday(Lines);

                var l = new Lines({
                    owner: self.user,
                    count: loc,
                    date: {
                        start: self.prevMidnight,
                        end: self.nextMidnight
                    }
                });

                l.save(function(err, newL) {
                    if (err)
                        console.log("Unable to save GitHub data!")
                });
            });

            self._removePastToday(Commits);

            var c = new Commits({
                owner: self.user,
                count: commits.length,
                date: {
                    start: self.prevMidnight,
                    end: self.nextMidnight
                }
            });

            c.save(function(err, newC) {
                if (err)
                    console.log("Unable to save GitHub data!")
            });
        });
    }

    if (_.has(connections, Constants.PIVOTAL_TRACKER)) {
        var piv = new PivotalTracker(connections[Constants.PIVOTAL_TRACKER].token);

        piv.getUserIdentifier(function(uid) {
            piv.getStoryPoints(uid, 0, function(count) {
                self._removePastToday(StoryPoints);

                var sp = new StoryPoints({
                    owner: self.user,
                    count: count,
                    date: {
                        start: self.prevMidnight,
                        end: self.nextMidnight
                    }
                });

                sp.save(function(err, newSP) {
                    if (err)
                        console.log("Unable to save Pivotal data!");
                });
            });
        });
    }

    if (_.has(connections, Constants.BUGZILLA)) {
        var bmo = new Bugzilla(connections[Constants.BUGZILLA].server);

        bmo.getBugsResolvedToday(connections[Constants.BUGZILLA].username, function(count) {
            self._removePastToday(Issues);

            var i = new Issues({
                owner: self.user,
                count: count,
                date: {
                    start: self.prevMidnight,
                    end: self.nextMidnight
                }
            });

            i.save(function(err, newI) {
                if (err)
                    console.log("Unable to save Bugzilla data!")
            });
        });
    }
};

function tryFinishGetAcquired(cb, vars) {
    for (var key in vars)
        if (vars.hasOwnProperty(key))
            if (vars[key] == -1)
                return;

    cb(vars);
}

GetData.prototype.getAcquired = function(date, ignoreTeam, cb) {
    var cCount = -1;
    var lCount = -1;
    var spCount = -1;
    var iCount = -1;
    var hCount = -1;
    var weather = -1;

    var lu = DateUtils.getLowerUpperBoundDate(date);

    if (!ignoreTeam) {
        if (lu.lower < this.user.teamMemberSince)
            return cb({
                "Commits" : null,
                "LinesOfCode": null,
                "StoryPoints": null,
                "Issues": null,
                "HoursOfWork": null,
                "Weather": null
            });
    }

    function finish() {
        tryFinishGetAcquired(cb, {
            "Commits" : cCount,
            "LinesOfCode": lCount,
            "StoryPoints": spCount,
            "Issues": iCount,
            "HoursOfWork": hCount,
            "Weather": weather
        });
    }

    Commits.find({ owner: this.user, "date.start": { $gte: lu.lower, $lte: lu.upper } }, function(err, commits) {
        var cLocal = 0;

        if (commits != null)
            commits.forEach(function(c) {
                cLocal += c.count;
            });
        
        cCount = cLocal;

        finish();
    });

    Lines.find({ owner: this.user, "date.start": { $gte: lu.lower, $lte: lu.upper } }, function(err, lines) {
        var lLocal = 0;

        if (lines != null)
            lines.forEach(function(l) {
                lLocal += l.count;
            });

        lCount = lLocal;

        finish();
    });

    StoryPoints.find({ owner: this.user, "date.start": { $gte: lu.lower, $lte: lu.upper } }, function(err, storyPoints) {
        var spLocal = 0;

        if (storyPoints != null)
            storyPoints.forEach(function(sp) {
                spLocal += sp.count;
            });

        spCount = spLocal;

        finish();
    });

    Issues.find({ owner: this.user, "date.start": { $gte: lu.lower, $lte: lu.upper } }, function(err, issues) {
        var iLocal = 0;

        if (issues != null)
            issues.forEach(function(i) {
                iLocal += i.count;
            });

        iCount = iLocal;

        finish();
    });

    WorkLog.find({ owner: this.user, "date.start": { $gte: lu.lower, $lte: lu.upper } }, function(err, wl) {
        var hLocal = 0;

        if (wl != null)
            wl.forEach(function(w) {
                hLocal += w.getSeconds() / 60 / 60;
            });

        hCount = hLocal;

        finish();
    });

    Weather.findOne({ "date": lu.lower, "location": this.user.location }, function(err, w) {
        if (w != null)
            weather = w.condition;
        else
            weather = null;

        finish();
    })
};

function addDays(date, days) {
    var result = new Date(date);

    result.setDate(result.getDate() + days);

    return result;
}

GetData.prototype.getAcquiredSince = function(date, cb) {
    var self = this;

    var ga = {};
    var count = 0;

    while (true) {
        if (date > Date.now())
            break;

        count++;

        (function() {
            var scopedDate = new Date(date);

            self.getAcquired(scopedDate, true, function(res) {
                ga[dateformat(scopedDate, 'yyyy/mm/dd')] = res;

                count--;

                if (count == 0)
                    return cb(ga);
            });
        })();

        date = addDays(date, 1);
    }
};

module.exports = GetData;