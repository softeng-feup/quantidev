var mongoose = require('mongoose');

var moment = require('moment');
var randomstring = require('randomstring');

var User = require('./user');
var Sprint = require('./sprint');
var Worklog = require('./worklog');

var StoryPoints = require('./storypoints');

var DateUtils = require('../util/date');

var TeamSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    workplace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workplace' },
    open: { type: Boolean, default: false },
    joinKey: String,
    sprints: {
        length: Number,     //  Length in days!
        start: Date         //  Date of first sprint tracked by the tool.
    }
});

TeamSchema.methods.getMembers = function(cb) {
     User.find({ team: this }, function(err, users) {
         cb(err, users);
     });
};

TeamSchema.methods._teamMemberInWorkplace = function(m, day, wp, cb) {
    Worklog.find({ owner: m, "date.start": { $gte: day.lower, $lte: day.upper } }, function(err, wl) {
        var working = true;

        if (wl.length == 0)
            return cb(false);

        wl.forEach(function(w) {
            if (!w.isInWorkplace(wp))
                working = false;
        });

        cb(working);
    });
};

TeamSchema.methods._timesTeamMemberInWorkplace = function(member, day, wp, cb) {
    Worklog.find({ owner: member, "date.start": { $gte: day.lower, $lte: day.upper } }, function(err, wl) {
        if (err)
            cb(null);

        var times = [];

        wl.forEach(function(x) {
            if (x.isInWorkplace(wp))
                times.push(x.date);
        });

        cb(times);
    });
};

TeamSchema.methods._timesTeamMembersInWorkplace = function(members, day, wp, cb) {
    var self = this;

    var c = members.length;

    var sum = [];

    members.forEach(function(m) {
        self._timesTeamMemberInWorkplace(m, day, wp, function(t) {
            sum.push({
                member: m,
                times: t
            });

            if (--c == 0)
                cb(sum);
        });
    });
};

//  Did everyone meet today?

TeamSchema.methods.workingTogether = function(day, cb) {
    var self = this;

    day = DateUtils.getLowerUpperBoundDate(day);

    var wp = {
        latitude: this.workplace.latitude,
        longitude: this.workplace.longitude
    };

    this.getMembers(function(err, members) {
        var count = members.length;
        var working = true;

        members.forEach(function(m) {
            self._teamMemberInWorkplace(m, day, wp, function(inWorkplace) {
                if (!inWorkplace)
                    working = false;

                count--;

                if (count == 0)
                    cb(working);
            });
        });
    });
};

TeamSchema.methods.membersInWorkplaceDetail = function(day, cb) {
    var self = this;

    day = DateUtils.getLowerUpperBoundDate(day);

    this.populate('workplace', function(err, newSelf) {
        if (!newSelf.workplace)
            return cb([]);

        var wp = {
            latitude: newSelf.workplace.latitude,
            longitude: newSelf.workplace.longitude
        };

        self.getMembers(function(err, members) {
            self._timesTeamMembersInWorkplace(members, day, wp, function(ret) {
                cb(ret);
            });
        });
    });
};

TeamSchema.methods.unionMembersInWorkplace = function(day, cb) {
    var self = this;

    day = DateUtils.getLowerUpperBoundDate(day);

    this.populate('workplace', function(err, newSelf) {
        if (!newSelf.workplace)
            return cb([]);

        var wp = {
            latitude: newSelf.workplace.latitude,
            longitude: newSelf.workplace.longitude
        };

        self.getMembers(function(err, members) {
            self._timesTeamMembersInWorkplace(members, day, wp, function(membersWorkplace) {
                var union = [];

                for (var mw in membersWorkplace) {
                    mw = membersWorkplace[mw];

                    //  While that this appears to work, one may also want to check it out.

                    if (mw.times.length == 0)
                        continue;

                    if (union.length == 0) {
                        union = mw.times;

                        continue;
                    }

                    var localUnion = [];

                    for (var i in union) {
                        i = union[i];

                        for (var j in mw.times) {
                            j = mw.times[j];

                            if (i.start < j.start) {
                                if (i.end < j.start) {
                                    // i starts and ends before j starts.

                                    //  i   |---|
                                    //  j           |--|

                                    //  Add both.

                                    localUnion.push(i);
                                    localUnion.push(j);

                                    continue;
                                } else {
                                    //  i starts before j, but ends after i starts

                                    if (j.end < i.end) {
                                        //  i   |--------|
                                        //  j       |--|

                                        localUnion.push(i);

                                    } else {
                                        //  i   |-----|
                                        //  j       |----|

                                        localUnion.push({
                                            start: i.start,
                                            end: j.end
                                        });
                                    }
                                }
                            } else {
                                //  i starts after j starts

                                if (j.end > i.start) {
                                    //  j ends after i starts

                                    if (i.end > j.end) {
                                        //  i       |----|
                                        //  j   |------|

                                        localUnion.push({
                                            start: j.start,
                                            end: i.end
                                        });
                                    } else {
                                        //  i       |---|
                                        //  j   |--------|

                                        localUnion.push(j);
                                    }
                                } else {
                                    //  j ends before i starts

                                    //  i           |----|
                                    //  j   |--|

                                    localUnion.push(j);
                                    localUnion.push(i);

                                    continue;
                                }
                            }
                        }
                    }

                    //  Set union as localUnion...

                    union = localUnion;
                }

                //  Workaround here...

                for (var i = 0; i < union.length - 1; i++) {
                    var first = union[i];
                    var second = union[i + 1];

                    if (first.start === second.start)
                        union.splice(i, 1);
                }

                cb(union);
            });
        });
    });
}

TeamSchema.methods.intersectedMembersInWorkplace = function(day, cb) {
    var self = this;

    day = DateUtils.getLowerUpperBoundDate(day);

    this.populate('workplace', function(err, newSelf) {
        if (!newSelf.workplace)
            return cb([]);

        var wp = {
            latitude: newSelf.workplace.latitude,
            longitude: newSelf.workplace.longitude
        };

        self.getMembers(function(err, members) {
            self._timesTeamMembersInWorkplace(members, day, wp, function(membersWorkplace) {
                var intersect = [];

                for (var mw in membersWorkplace) {
                    mw = membersWorkplace[mw];

                    if (mw.times.length == 0)
                        return cb([]);

                    if (intersect.length == 0) {
                        intersect = mw.times;

                        continue;
                    }

                    var localIntersect = [];

                    for (var i in intersect) {
                        i = intersect[i];

                        for (var j in mw.times) {
                            j = mw.times[j];

                            if (i.start < j.start) {
                                if (i.end < j.start) {
                                    // i starts and ends before j starts.

                                    //  i   |---|
                                    //  j           |--|

                                    //  Skip this crap.

                                    continue;
                                } else {
                                    //  i starts before j, but ends after i starts

                                    if (j.end < i.end) {
                                        //  i   |--------|
                                        //  j       |--|

                                        localIntersect.push(j);

                                    } else {
                                        //  i   |-----|
                                        //  j       |----|

                                        localIntersect.push({
                                            start: j.start,
                                            end: i.end
                                        });
                                    }
                                }
                            } else {
                                //  i starts after j starts

                                if (j.end > i.start) {
                                    //  j ends after i starts

                                    if (i.end > j.end) {
                                        //  i       |----|
                                        //  j   |------|

                                        localIntersect.push({
                                            start: i.start,
                                            end: j.end
                                        });
                                    } else {
                                        //  i       |---|
                                        //  j   |--------|

                                        localIntersect.push(i);
                                    }
                                } else {
                                    //  j ends before i starts

                                    //  i           |----|
                                    //  j   |--|

                                    //  Skip this shit.

                                    continue;
                                }
                            }
                        }
                    }

                    //  Set intersect as localIntersect...

                    intersect = localIntersect;
                }

                cb(intersect);
            });
        });
    });
};

TeamSchema.methods.metricMembersInWorkplace = function(day, cb) {
    var self = this;

    this.intersectedMembersInWorkplace(day, function(intersect) {
        self.unionMembersInWorkplace(day, function(union) {
            var intersectTime = 0;
            var unionTime = 0;

            for (var i in intersect) {
                i = intersect[i];

                if (i.end) {
                    var diff = i.end.getTime() - i.start.getTime();

                    intersectTime += Math.abs(diff / 1000);
                }
            }

            for (var u in union) {
                u = union[u];

                if (u.end) {
                    var diff = u.end.getTime() - u.start.getTime();

                    unionTime += Math.abs(diff / 1000);
                }
            }

            cb({
                intersect: intersectTime,
                union: unionTime
            });
        });
    });
};

TeamSchema.methods.communicationHealthForDay = function(day, cb) {
    var health = [];
    var count = 0;

    this.getMembers(function(err, members) {
        if (!members.length)
            return cb([]);

        members.forEach(function(member) {
            member.communicationHealthForDay(day, function(h) {
                health.push({
                    member: member.id,
                    rating: (h ? h.rating : null)
                });

                if (++count == members.length)
                    cb(health);
            });
        });
    });
};

TeamSchema.methods.storyPointsForDay = function(day, cb) {
    day = DateUtils.getLowerUpperBoundDate(day);

    var points = [];
    var count = 0;

    this.getMembers(function(err, members) {
        if (!members.length)
            return cb([]);

        members.forEach(function(member) {
            StoryPoints.findOne({ owner: member, "date.start": { $gte: day.lower, $lte: day.upper } }, function(err, sp) {
                points.push({
                    member: member.id,
                    points: (sp ? sp.count : 0)
                });

                if (++count == members.length)
                    cb(points);
            });
        });
    });
};

TeamSchema.methods.generateKey = function(cb) {
    this.joinKey = randomstring.generate(6);

    this.save(function(err, newTeam) {
        return cb(newTeam.joinKey);
    });
};

TeamSchema.methods.prepareForDeletion = function(cb) {
    this.getMembers(function(err, members) {
        var left = members.length;

        members.forEach(function(member) {
            member.leaveTeam(function(success) {
                if (!success)
                    return cb(false);
                else {
                    if (!--left)
                        return cb(true);
                }
            });
        });
    });
};

TeamSchema.methods.pastSprintsSince = function(since, cb) {
    Sprint.find({ team: this, 'date.end': { $gt: since } }).sort('-date.start').exec(function(err, sprints) {
        return cb(sprints);
    });
};

TeamSchema.methods.pastSprints = function(cb) {
    Sprint.find({ team: this }).sort('-date.start').exec(function(err, sprints) {
        return cb(sprints);
    });
};

TeamSchema.methods.currentSprintData = function(cb) {
    var self = this;

    this.lastSprint(function(err, sprint) {
        if (!sprint) {
            var st = DateUtils.toDateYMD(self.sprints.start);
            var ed = DateUtils.toDateYMD(moment(self.sprints.start).add(self.sprints.length, 'days').toDate());

            return cb({
                start: st,
                end: ed
            });
        }

        // var start = DateUtils.toDateYMD(sprint.date.start);
        //
        // start.day++;
        //
        // var end = DateUtils.toDateYMD(moment(sprint.date.start).add(self.sprints.length, 'days').toDate());
        //
        // return cb({
        //     start: start,
        //     end: end
        // });

        var startMoment = moment(sprint.date.start).add(self.sprints.length + 1, 'days');

        var start = DateUtils.toDateYMD(startMoment.toDate());

        var end = DateUtils.toDateYMD(startMoment.add(self.sprints.length + 1, 'days').toDate());

        return cb({
            start: start,
            end: end
        });
    });
};

TeamSchema.methods.lastSprint = function(cb) {
    Sprint.find({ team: this }).sort('-date.start').exec(function(err, sprints) {
        if (err)
            cb(err, null);

        if (!sprints.length)
            return cb(null, null);

        return cb(null, sprints[0]);
    });
};

module.exports = mongoose.model('Team', TeamSchema);
