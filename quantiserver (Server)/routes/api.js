var _ = require('lodash');

var express = require('express');
var router = express.Router();

var passport = require('passport');

var Cohesion = require('../database/cohesion');
var Communication = require('../database/communication');
var Interaction = require('../database/interaction');
var User = require('../database/user');
var Team = require('../database/team');
var Sprint = require('../database/sprint');
var WorkLog = require('../database/worklog');
var Workplace = require('../database/workplace');

var Constants = require('../util/const');
var DateUtils = require('../util/date');
var GetData = require('../util/get-data');

router.get('/', function(req, res, next) {
    return res.send({
        success: false,
        error: 'Invalid Request.'
    });
});

function checkForAPIAuth(req, res, next) {
    var username = null;
    var token = null;

    if (req.header('Authorization')) {
        var auth = _.split(_.split(req.header('Authorization'), ' ')[1], ';');

        username = auth[0];
        token = auth[1];
    } else
        return res.send({
            success: false,
            error: 'This method requires authentication.'
        });

    User.findOne({ username: username }, function(err, user) {
        var authFailedResponse = {
            success: false,
            error: 'Authentication failed.'
        };

        if (err || !user)
            return res.send(authFailedResponse);

        var found = false;

        user.tokens.forEach(function(t) {
            if (t.token == token) {
                found = true;

                req.user = user;

                return next();
            }
        });

        if (!found)
            return res.send(authFailedResponse);
    });
}

router.get('/login', passport.authenticate('local', { session: false }), function(req, res, next) {
    req.user.generateToken(function(err, token) {
        if (err)
            return res.send({
                success: false,
                error: err
            });

        return res.send({
            success: true,
            user: {
                name: req.user.name
            },
            token: token
        });
    });
});

router.post('/signup', function(req, res, next) {
    if (!req.body.name || !req.body.username || !req.body.password || !req.body.email)
        return res.send({
            success: false,
            error: 'All fields are required.'
        });

    User.find({ username: req.body.username }, function(err, users) {
        if (err)
            return res.send({
                success: false,
                error: 'Internal error!'
            });

        if (users.length)
            return res.send({
                success: false,
                error: 'There is already a user with this username in the system.'
            });

        User.find({ email: req.body.email }, function(err, users) {
            if (err)
                return res.send({
                    success: false,
                    error: 'Internal error!'
                });

            if (users.length)
                return res.send({
                    success: false,
                    error: 'There is already a user with this e-mail address in the system.'
                });

            var u = new User({
                name: req.body.name,
                username: req.body.username,
                password: req.body.password,
                email: req.body.email
            });

            u.save(function(err, user) {
                if (err)
                    return res.send({
                        success: false,
                        error: err
                    });

                return res.send({
                    success: true
                });
            });
        });
    });
});

router.post('/logout', function(req, res, next) {
    var username = null;
    var token = null;

    if (req.header('Authorization')) {
        var auth = _.split(_.split(req.header('Authorization'), ' ')[1], ';');

        username = auth[0];
        token = auth[1];
    } else
        return res.send({
            success: false,
            error: 'This method requires authentication.'
        });

    User.findOne({ username: username }, function(err, user) {
        var authFailedResponse = {
            success: false,
            error: 'Authentication failed.'
        };

        if (err || !user)
            return res.send(authFailedResponse);

        var found = false;

        user.tokens.forEach(function(t) {
            if (t.token == token) {
                found = true;

                req.user = user;

                user.logout(token);

                return res.send({
                    success: true
                });
            }
        });

        if (!found)
            return res.send(authFailedResponse);
    });
});

router.get('/update', checkForAPIAuth, function(req, res, next) {
    try {
        var gd = new GetData(req.user);

        gd.get();

        res.send({
            success: true
        });
    } catch (e) {
        res.send({
            success: false,
            error: e
        })
    }
});

router.post('/user/settings/password', checkForAPIAuth, function(req, res, next) {
    if (!req.body.oldPassword || !req.body.newPassword)
        return res.send({
            success: false,
            error: 'Missing required fields.'
        });

    req.user.comparePassword(req.body.oldPassword, function(err, result) {
        if (err)
            return res.send({
                success: false,
                error: 'An internal error has occurred.'
            });

        if (!result)
            return res.send({
                success: false,
                error: 'The inserted password does not match the one in our records.'
            });

        req.user.password = req.body.newPassword;

        req.user.save(function(err, newUser) {
            if (err)
                return res.send({
                    success: false,
                    error: 'An error has occurred while updating your user.'
                });

            return res.send({
                success: true
            });
        });
    });
});

router.post('/user/settings/email', checkForAPIAuth, function(req, res, next) {
    if (!req.body.oldEmail || !req.body.newEmail)
        return res.send({
            success: false,
            error: 'Missing required fields.'
        });

    if (req.user.email != req.body.oldEmail)
        return res.send({
            success: false,
            error: 'The inserted e-mail address does not match the one in our records.'
        });

    req.user.email = req.body.newEmail;

    req.user.save(function(err, newUser) {
        if (err)
            return res.send({
                success: false,
                error: 'An error has occurred while updating your user.'
            });

        return res.send({
            success: true
        });
    });
});

router.get('/user/settings/location', checkForAPIAuth, function(req, res, next) {
    res.send({
        success: true,
        location: req.user.location || ''
    });
});

router.post('/user/settings/location', checkForAPIAuth, function(req, res, next) {
    if (!req.body.location)
        return res.send({
            success: false,
            error: 'Missing required fields.'
        });

    req.user.location = req.body.location;

    req.user.save(function(err, newUser) {
        if (err)
            return res.send({
                success: false,
                error: 'An error has occurred while updating your user.'
            });

        return res.send({
            success: true
        });
    });
});

function continueDeletion(req, res, next) {
    req.user.prepareForDeletion(function(err) {
        if (err)
            return res.send({
                success: false,
                error: 'An error has occurred while deleting data associated with your user.'
            });

        req.user.remove(function(e) {
            if (e)
                return res.send({
                    success: false,
                    error: 'An error has occurred while deleting your user.'
                });

            return res.send({
                success: true
            });
        });
    });
}

router.delete('/user', checkForAPIAuth, function(req, res, next) {
    if (req.user.team) {
        req.user.populate('team', function(err, user) {
            if (user.team.owner == user.id)
                return res.send({
                    success: false,
                    error: 'You must not be the owner of a team in order to perform the requested operation.'
                });

            continueDeletion(req, res, next);
        });
    } else
        continueDeletion(req, res, next);
});

router.get('/user/by/id/:id', checkForAPIAuth, function(req, res, next) {
    User.findById(req.params.id, function(err, user) {
        if (err)
            return res.send({
                success: false,
                error: err
            });

        if (!user)
            return res.send({
                success: false,
                error: 'User not found.'
            });

        res.send({
            success: true,
            user: user.getPublicData()
        });
    });
});

router.get('/user/by/username/:username', checkForAPIAuth, function(req, res, next) {
    User.findOne({ username: req.params.username }, function(err, user) {
        if (err)
            return res.send({
                success: false,
                error: err
            });

        if (!user)
            return res.send({
                success: false,
                error: 'User not found.'
            });

        res.send({
            success: true,
            user: user.getPublicData()
        });
    })
});

router.get('/team', checkForAPIAuth, function(req, res, next) {
    if (!req.user.team)
        return res.send({
            success: false,
            error: 'No team associated with user.'
        });

    req.user.populate('team', function(err, user) {
        user.team.populate('owner', function(err, t) {
            var team = {
                id: user.team.id,
                name: t.name,
                owner: t.owner.username
            };

            user.team.getMembers(function(err, members) {
                return res.send({
                    success: true,
                    team: {
                        details: team,
                        members: (function() {
                            var arr = [];

                            members.forEach(function(m) {
                                arr.push(m.getPublicData());
                            });

                            return arr;
                        })()
                    }
                })
            });
        });
    });
});

router.post('/team', checkForAPIAuth, function(req, res, next) {
    if (!req.body.name)
        return res.send({
            success: false,
            error: 'Missing \'name\' parameter.'
        });

    if (req.user.team)
        return res.send({
            success: false,
            error: 'You are already member of a team!'
        });

    var team = new Team({
        name: req.body.name,
        owner: req.user
    });

    team.save(function(err, newTeam) {
        if (err) {
            if (err.code == 11000)
                return res.send({
                    success: false,
                    error: 'A team with this name already exists!'
                });
            else
                return res.send({
                    success: false,
                    error: err.message
                });
        }

        req.user.team = newTeam;
        req.user.teamMemberSince = Date.now();

        req.user.save(function(err, newUser) {
            if (err)
                return res.send({
                    success: false,
                    error: err.message
                });

            return res.send({
                success: true,
                teamId: newTeam.id
            });
        });
    });
});

router.delete('/team', checkForAPIAuth, function(req, res, next) {
    if (!req.user.team)
        return res.send({
            success: false,
            error: 'No team associated with user.'
        });

    req.user.populate('team', function(err, user) {
        var team = user.team;

        if (team.owner != user.id)
            return res.send({
                success: false,
                error: 'This action can only be performed by the team owner.'
            });

        team.prepareForDeletion(function(done) {
            if (!done)
                return res.send({
                    success: false,
                    error: 'Internal server error.'
                });

            team.remove(function(err) {
                if (err)
                    return res.send({
                        success: false,
                        error: err
                    });

                return res.send({
                    success: true
                });
            });
        });


    });
});

router.get('/team/list', checkForAPIAuth, function(req, res, next) {
    Team.find({}).populate('owner').exec(function(err, teams) {
        if (err)
            return res.send({
                success: false,
                error: err
            });

        var ret = [];

        teams.forEach(function(t) {
            ret.push({
                id: t.id,
                name: t.name,
                owner: t.owner.name,
                open: t.open
            });
        });

        return res.send({
            success: true,
            teams: ret
        });
    });
});

router.post('/team/join', checkForAPIAuth, function(req, res, next) {
    if (!req.body.id)
        return res.send({
            success: false,
            error: 'Missing \'id\' parameter.'
        });

    if (req.user.team)
        return res.send({
            success: false,
            error: 'You can only be a member of one team at once.'
        });

    Team.findById(req.body.id, function(err, team) {
        if (team.open) {
            req.user.joinTeam(team, function(err) {
                if (err)
                    return res.send({
                        success: false
                    });

                return res.send({
                    success: true
                });
            });
        } else if (req.body.key) {
            if (req.body.key != team.joinKey)
                return res.send({
                    success: false,
                    error: 'Invalid join key.'
                });

            req.user.joinTeam(team, function(success) {
                return res.send({
                    success: success
                });
            });
        } else
            return res.send({
                success: false,
                error: 'Missing \'key\' parameter.'
            });
    });
});

router.post('/team/leave', checkForAPIAuth, function(req, res, next) {
    if (!req.user.team)
        return res.send({
            success: false,
            error: 'You are not a member of any team!'
        });

    req.user.leaveTeam(function(s) {
        return res.send({
            success: s
        });
    });
});

router.get('/team/settings', checkForAPIAuth, function(req, res, next) {
    if (!req.user.team)
        return res.send({
            success: false,
            error: 'You are not a member of any team!'
        });

    req.user.populate('team', function(err, user) {
        if (user.team.owner != user.id)
            return res.send({
                success: false,
                error: 'This action can only be performed by the team owner.'
            });

        var spr = null;

        if (user.team.sprint && user.team.sprint.length) {
            spr = {
                length: user.team.sprint.length,
                end: user.team.sprintEndDate()
            }
        }

        return res.send({
            success: true,
            settings: {
                joinKey: user.team.joinKey,
                open: user.team.open,
                sprint: spr
            }
        });
    });
});

router.post('/team/settings', checkForAPIAuth, function(req, res, next) {
    if (!req.user.team)
        return res.send({
            success: false,
            error: 'You are not a member of any team!'
        });

    req.user.populate('team', function(err, user) {
        if (user.team.owner != user.id)
            return res.send({
                success: false,
                error: 'This action can only be performed by the team owner.'
            });

        if (_.has(req.body, 'name'))
            user.team.name = req.body.name;

        if (_.has(req.body, 'open'))
            user.team.open = req.body.open;

        if (_.has(req.body, 'joinKey'))
            user.team.joinKey = req.body.joinKey;

        user.team.save(function(err, t) {
            if (err)
                return res.send({
                    success: false,
                    error: (err.code == 11000 ? 'A team with this name already exists.' : err.message)
                });

            return res.send({
                success: true
            });
        });
    });
});

router.get('/team/sprint', checkForAPIAuth, function(req, res, next) {
    if (!req.user.team)
        return res.send({
            success: false,
            error: 'You are not a member of any team!'
        });

    req.user.populate('team', function(err, user) {
        var team = user.team;

        if (!team.sprints.length || !team.sprints.start)
            return res.send({
                success: false,
                error: 'Sprint not setup!'
            });

        team.currentSprintData(function(sd) {
            return res.send({
                success: true,
                sprint: {
                    length: team.sprints.length,
                    date: sd.start
                }
            });
        });
    });
});

router.post('/team/sprint', checkForAPIAuth, function(req, res, next) {
    if (!req.user.team)
        return res.send({
            success: false,
            error: 'You are not a member of any team!'
        });

    req.user.populate('team', function(err, user) {
        var team = user.team;

        if (user.team.owner != user.id)
            return res.send({
                success: false,
                error: 'This action can only be performed by the team owner.'
            });

        if (!req.body.length || !req.body.year || !req.body.month || !req.body.day)
            return res.send({
                success: false,
                error: 'Missing required fields!'
            });

        team.sprints.length = req.body.length;
        team.sprints.start = new Date(req.body.year, req.body.month - 1, req.body.day);

        team.save(function(err, t) {
            if (err)
                return res.send({
                    success: false,
                    error: err.message
                });

            return res.send({
                success: true
            });
        });
    });
});

router.get('/team/sprint/current', checkForAPIAuth, function(req, res, next) {
    if (!req.user.team)
        return res.send({
            success: false,
            error: 'You are not a member of any team!'
        });

    req.user.populate('team', function(err, user) {
        var team = user.team;

        if (!team.sprints.length || !team.sprints.start)
            return res.send({
                success: false,
                error: 'Sprint not setup!'
            });

        team.currentSprintData(function(sprint) {
            return res.send({
                success: true,
                sprint: sprint
            });
        });
    });
});

router.get('/team/sprint/:identifier', checkForAPIAuth, function(req, res, next) {
    if (!req.user.team)
        return res.send({
            success: false,
            error: 'You are not a member of any team!'
        });

    req.user.populate('team', function(err, user) {
        var team = user.team;

        Sprint.findById(req.params.identifier, function(err, s) {
            if (err)
                return res.send({
                    success: false,
                    error: err.message
                });

            if (!s)
                return res.send({
                    success: false,
                    error: 'Sprint not found.'
                });

            if (s.team != team.id)
                return res.send({
                    success: false,
                    error: 'The sprint exists, but it\'s not part of the team you are currently contained in.'
                });

            return res.send({
                success: true,
                sprint: {
                    date: s.dateYMD()
                }
            });
        });
    });
});

router.get('/team/sprint/:identifier/user', checkForAPIAuth, function(req, res, next) {
    if (!req.user.team)
        return res.send({
            success: false,
            error: 'You are not a member of any team!'
        });

    req.user.populate('team', function(err, user) {
        var team = user.team;

        Sprint.findById(req.params.identifier, function(err, s) {
            if (err)
                return res.send({
                    success: false,
                    error: err.message
                });

            if (!s)
                return res.send({
                    success: false,
                    error: 'Sprint not found.'
                });

            if (s.team != team.id)
                return res.send({
                    success: false,
                    error: 'The sprint exists, but it\'s not part of the team you are currently contained in.'
                });

            s.getCohesionReportForUser(req.user, function(err, report) {
                return res.send({
                    success: true,
                    sprint: {
                        date: s.dateYMD(),
                        cohesion: (report != null)
                    }
                });
            });
        });
    });
});

router.get('/team/sprints/user', checkForAPIAuth, function(req, res, next) {
    if (!req.user.team)
        return res.send({
            success: false,
            error: 'You are not a member of any team!'
        });

    req.user.populate('team', function(err, user) {
        var team = user.team;

        team.pastSprintsSince(user.teamMemberSince, function(spr) {
            var sprints = [];

            var remaining = spr.length;
            var nextIdx = 0;

            if (!remaining)
                return res.send({
                    success: true,
                    sprints: []
                });

            spr.forEach(function(s) {
                var idx = nextIdx++;

                sprints.push(null);

                s.getCohesionReportForUser(req.user, function(err, report) {
                    sprints[idx] = {
                        id: s.id,
                        date: s.dateYMD(),
                        cohesion: (report != null)
                    };

                    if (!--remaining) {
                        return res.send({
                            success: true,
                            sprints: sprints
                        });
                    }
                });
            });
        });
    });
});

router.get('/team/sprint/:sprint/cohesion/summary', checkForAPIAuth, function(req, res, next) {
    if (!req.user.team)
        return res.send({
            success: false,
            error: 'You are not a member of any team!'
        });

    req.user.populate('team', function(err, user) {
        var team = user.team;

        if (user.team.owner != user.id)
            return res.send({
                success: false,
                error: 'This action can only be performed by the team owner.'
            });

        Sprint.findById(req.params.sprint, function(err, sprint) {
            if (err)
                return res.send({
                    success: false,
                    error: err.message
                });

            if (!sprint)
                return res.send({
                    success: false,
                    error: 'Sprint not found.'
                });

            if (sprint.team != team.id)
                return res.send({
                    success: false,
                    error: 'The requested sprint does not belong to your team!'
                });

            sprint.getCohesionReports(function(err, reports) {
                if (err)
                    return res.send({
                        success: false,
                        error: err.message
                    });

                var rep = [];

                reports.forEach(function(r) {
                    rep.push(r.summary());
                });

                return res.send({
                    success: true,
                    reports: rep
                });
            });
        });
    });
});

router.post('/team/sprint/:sprint/cohesion', checkForAPIAuth, function(req, res, next) {
    if (!req.user.team)
        return res.send({
            success: false,
            error: 'You are not a member of any team!'
        });

    req.user.populate('team', function(err, user) {
        var team = user.team;

        Sprint.findById(req.params.sprint, function(err, s) {
            if (s.team != team.id)
                return res.send({
                    success: false,
                    error: 'You are not allowed to access this sprint\'s data!'
                });

            s.getCohesionReportForUser(user, function(err, report) {
                if (err)
                    return res.send({
                        success: false,
                        error: err.message
                    });

                if (report)
                    return res.send({
                        success: false,
                        error: 'You have already submitted a cohesion report for this sprint!'
                    });

                var a = [];

                for (var i = 1; i <= 9; i++) {
                    var answer = req.body["q" + i];

                    if (!answer)
                        return res.send({
                            success: false,
                            error: 'Missing answer for question ' + i + '!'
                        });

                    a.push({
                        question: i,
                        answer: +answer
                    });
                }

                var c = new Cohesion({
                    owner: user,
                    sprint: s,
                    answers: a,
                    date: Date.now()
                });

                c.save(function(err, savedC) {
                    if (err)
                        return res.send({
                            success: false,
                            error: err.message
                        });

                    return res.send({
                        success: true
                    });
                })
            });
        });
    });
});

router.get('/team/sprints/:fromYear/:fromMonth/:fromDay/to/:toYear/:toMonth/:toDay', checkForAPIAuth, function(req, res, next) {
    var startDate = DateUtils.fromDateYMD({
        year: req.params.fromYear,
        month: req.params.fromMonth,
        day: req.params.fromDay
    });

    var endDate = DateUtils.fromDateYMD({
        year: req.params.toYear,
        month: req.params.toMonth,
        day: req.params.toDay
    });

    if (!req.user.team)
        return res.send({
            success: false,
            error: 'You are not a member of any team!'
        });

    req.user.populate('team', function(err, user) {
        var team = user.team;

        Sprint.find({
            team: team.id,
            $or: [
                { 'date.start' : { $gte: startDate, $lte: endDate } },
                { 'date.end' : { $gte: startDate, $lte: endDate } }
            ]
        }).sort('date.end').exec(function(err, sprints) {
            var sp = [];
            var idx = 0;
            var remaining = sprints.length;

            if (!sprints.length)
                return res.send({
                    success: true,
                    sprints: sp
                });

            sprints.forEach(function(s) {
                var current = idx++;

                sp.push(null);

                var sprint = {
                    id: s.id,
                    date: s.dateYMD(),
                    cohesion: 0
                };

                s.getCohesionScore(function(score) {
                    sprint.cohesion = score;

                    sp[current] = sprint;

                    if (!--remaining) {
                        return res.send({
                            success: true,
                            sprints: sp
                        });
                    }
                });
            });
        });
    });
});

router.post('/team/key', checkForAPIAuth, function(req, res, next) {
    if (!req.user.team)
        return res.send({
            success: false,
            error: 'You are not a member of any team!'
        });

    req.user.populate('team', function(err, user) {
        if (user.team.owner != user.id)
            return res.send({
                success: false,
                error: 'This action can only be performed by the team owner.'
            });

        user.team.generateKey(function(key) {
            return res.send({
                success: true,
                key: key
            });
        });
    });
});

router.post('/team/leader', checkForAPIAuth, function(req, res, next) {
    //  Accepts an username.

    if (!req.user.team)
        return res.send({
            success: false,
            error: 'You are not a member of any team!'
        });

    req.user.populate('team', function(err, user) {
        var team = user.team;

        if (team.owner != user.id)
            return res.send({
                success: false,
                error: 'This action can only be performed by the team owner.'
            });

        User.findOne({ username: req.body.username }, function(err, newLeader) {
            if (err)
                return res.send({
                    success: false,
                    error: err.message
                });

            if (!newLeader)
                return res.send({
                    success: false,
                    error: 'User not found.'
                });

            team.owner = newLeader;

            team.save(function(err, newTeam) {
                if (err)
                    return res.send({
                        success: false,
                        error: err.message
                    });

                return res.send({
                    success: true
                });
            })
        });
    });
});

router.post('/team/kick', checkForAPIAuth, function(req, res, next) {
    //  Accepts an username.

    if (!req.user.team)
        return res.send({
            success: false,
            error: 'You are not a member of any team!'
        });

    req.user.populate('team', function(err, user) {
        var team = user.team;

        if (team.owner != user.id)
            return res.send({
                success: false,
                error: 'This action can only be performed by the team owner.'
            });

        User.findOne({ username: req.body.username }, function(err, toKick) {
            if (err)
                return res.send({
                    success: false,
                    error: err.message
                });

            if (toKick.team != team.id)
                return res.send({
                    success: false,
                    error: 'User is not a member of your team!'
                });

            toKick.team = null;

            toKick.save(function(err, newUser) {
                if (err)
                    return res.send({
                        success: false,
                        error: err.message
                    });

                return res.send({
                    success: true
                });
            });
        });
    });
});

router.get('/team/workplace', checkForAPIAuth, function(req, res, next) {
    if (!req.user.team)
        return res.send({
            success: false,
            error: 'No team associated with user.'
        });

    req.user.populate('team', function(err, user) {
        if (!user.team.workplace)
            return res.send({
                success: false,
                error: 'No workplace associated with the team.'
            });

        user.team.populate('workplace', function(err, team) {
            return res.send({
                success: true,
                workplace: {
                    latitude: team.workplace.latitude,
                    longitude: team.workplace.longitude,
                    identifier: team.workplace.identifier
                }
            });
        });
    });
});

function createWorkplace(team, req, res, next) {
    var w = new Workplace({
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        identifier: req.body.identifier
    });

    w.save(function(err, workplace) {
        if (err)
            return res.send({
                success: false,
                error: err
            });

        team.workplace = workplace;

        team.save(function(err, t) {
            if (err)
                return res.send({
                    success: false,
                    error: err
                });

            return res.send({
                success: true
            });
        });
    });
}

router.post('/team/workplace', checkForAPIAuth, function(req, res, next) {
    if (!req.user.team)
        return res.send({
            success: false,
            error: 'No team associated with user.'
        });

    if (!req.body.latitude || !req.body.longitude || !req.body.identifier)
        return res.send({
            success: false,
            error: 'Insufficient parameters.'
        });

    req.user.populate('team', function(err, user) {
        if (user.team.workplace)
            req.user.team.populate('workplace', function (err, team) {
                team.workplace.remove(function (err) {
                    createWorkplace(user.team, req, res, next);
                });
            });
        else
            createWorkplace(user.team, req, res, next);
    });
});

router.get('/team/intersect/:year/:month/:day', checkForAPIAuth, function(req, res, next) {
    if (!req.user.team)
        return res.send({
            success: false,
            error: 'No team associated with user.'
        });

    req.user.populate('team', function(err, user) {
        if (user.team.owner != user.id)
            return res.send({
                success: false,
                error: 'This action can only be performed by the team owner.'
            });

        var dt = new Date(req.params.year, (req.params.month - 1), req.params.day, 0, 0, 0, 0);

        user.team.intersectedMembersInWorkplace(dt, function(intersect) {
            return res.send({
                success: true,
                intersect: intersect
            });
        });
    });
});

router.get('/team/union/:year/:month/:day', checkForAPIAuth, function(req, res, next) {
    if (!req.user.team)
        return res.send({
            success: false,
            error: 'No team associated with user.'
        });

    req.user.populate('team', function(err, user) {
        if (user.team.owner != user.id)
            return res.send({
                success: false,
                error: 'This action can only be performed by the team owner.'
            });

        var dt = new Date(req.params.year, (req.params.month - 1), req.params.day, 0, 0, 0, 0);

        user.team.unionMembersInWorkplace(dt, function(union) {
            return res.send({
                success: true,
                union: union
            });
        });
    });
});

router.get('/team/metric/:year/:month/:day', checkForAPIAuth, function(req, res, next) {
    if (!req.user.team)
        return res.send({
            success: false,
            error: 'No team associated with user.'
        });

    req.user.populate('team', function(err, user) {
        if (user.team.owner != user.id)
            return res.send({
                success: false,
                error: 'This action can only be performed by the team owner.'
            });

        var dt = new Date(req.params.year, (req.params.month - 1), req.params.day, 0, 0, 0, 0);

        user.team.metricMembersInWorkplace(dt, function(m) {
            return res.send({
                success: true,
                metric: m
            });
        });
    });
});

router.get('/team/detail/:year/:month/:day', checkForAPIAuth, function(req, res, next) {
    if (!req.user.team)
        return res.send({
            success: false,
            error: 'No team associated with user.'
        });

    req.user.populate('team', function(err, user) {
        if (user.team.owner != user.id)
            return res.send({
                success: false,
                error: 'This action can only be performed by the team owner.'
            });

        var dt = new Date(req.params.year, (req.params.month - 1), req.params.day, 0, 0, 0, 0);

        user.team.membersInWorkplaceDetail(dt, function(detail) {
            var toSend = [];

            detail.forEach(function(d) {
                //  member, times

                toSend.push({
                    member: d.member.id,
                    times: d.times
                });
            });

            return res.send({
                success: true,
                detail: toSend
            });
        });
    });
});

router.get('/team/communication/median/:year/:month/:day', checkForAPIAuth, function(req, res, next) {
    if (!req.user.team)
        return res.send({
            success: false,
            error: 'No team associated with user.'
        });

    req.user.populate('team', function(err, user) {
        if (user.team.owner != user.id)
            return res.send({
                success: false,
                error: 'This action can only be performed by the team owner.'
            });

        var dt = new Date(req.params.year, (req.params.month - 1), req.params.day, 0, 0, 0, 0);

        user.team.communicationHealthForDay(dt, function(cb) {
            var sum = 0;

            cb.forEach(function(c) {
                sum += c.rating;
            });

            return res.send({
                success: true,
                median: (sum / cb.length)
            });
        });
    });
});

router.get('/team/sp/median/:year/:month/:day', checkForAPIAuth, function(req, res, next) {
    if (!req.user.team)
        return res.send({
            success: false,
            error: 'No team associated with user.'
        });

    req.user.populate('team', function(err, user) {
        if (user.team.owner != user.id)
            return res.send({
                success: false,
                error: 'This action can only be performed by the team owner.'
            });

        var dt = new Date(req.params.year, (req.params.month - 1), req.params.day, 0, 0, 0, 0);

        user.team.storyPointsForDay(dt, function(cb) {
            var sum = 0;

            cb.forEach(function(c) {
                sum += c.points;
            });

            return res.send({
                success: true,
                median: (sum / cb.length)
            });
        });
    });
});

router.get('/team/communication/:year/:month/:day', checkForAPIAuth, function(req, res, next) {
    if (!req.user.team)
        return res.send({
            success: false,
            error: 'No team associated with user.'
        });

    req.user.populate('team', function(err, user) {
        if (user.team.owner != user.id)
            return res.send({
                success: false,
                error: 'This action can only be performed by the team owner.'
            });

        var dt = new Date(req.params.year, (req.params.month - 1), req.params.day, 0, 0, 0, 0);

        user.team.communicationHealthForDay(dt, function(cb) {
            return res.send({
                success: true,
                communication: cb
            });
        });
    });
});

router.get('/team/together/:year/:month/:day', checkForAPIAuth, function(req, res, next) {
    if (!req.user.team)
        return res.send({
            success: false,
            error: 'No team associated with user.'
        });

    req.user.populate('team', function(err, user) {
        if (user.team.owner != user.id)
            return res.send({
                success: false,
                error: 'This action can only be performed by the team owner.'
            });

        var dt = new Date(req.params.year, (req.params.month - 1), req.params.day, 0, 0, 0, 0);

        user.team.workingTogether(dt, function(working) {
            return res.send({
                success: true,
                together: working
            })
        });
    });
});

router.get('/team/external/:year/:month/:day', checkForAPIAuth, function(req, res, next) {
    if (!req.user.team)
        return res.send({
            success: false,
            error: 'No team associated with user.'
        });

    req.user.populate('team', function(err, user) {
        if (user.team.owner != user.id)
            return res.send({
                success: false,
                error: 'This action can only be performed by the team owner.'
            });

        user.team.getMembers(function(err, members) {
            var data = {};
            var remaining = members.length;

            members.forEach(function(m) {
                var gd = new GetData(m);

                var dt = new Date(req.params.year, (req.params.month - 1), req.params.day, 0, 0, 0, 0);

                dt.setHours(0, 0, 0, 0);

                gd.getAcquired(dt, false, function(vars) {
                    data[m.id] = vars;

                    if (--remaining == 0) {
                        return res.send({
                            success: true,
                            data: data
                        });
                    }
                });
            });
        });
    });
});

router.post('/log/leave', checkForAPIAuth, function(req, res, next) {
    WorkLog.findOne({
        owner: req.user,
        'date.end': null
    }, function(err, entry) {
        if (entry != null) {
            //  Entry does exist.

            entry.date.end = Date.now();

            entry.save(function(err, newEntry) {
                return res.send({
                    success: true
                });
            });
        } else {
            //  Entry does NOT exist.

            res.send({
                success: false,
                error: 'No existing entry!'
            });
        }
    });
});

router.post('/log/enter', checkForAPIAuth, function(req, res, next) {
    WorkLog.findOne({
        owner: req.user,
        'date.end': null
    }, function(err, entry) {
        if (entry != null) {
            //  Entry does exist.

            return res.send({
                success: false,
                error: 'An entry already exists!'
            })
        } else {
            //  Entry does NOT exist.

            var e = new WorkLog({
                owner: req.user,
                date: {
                    start: Date.now(),
                    end: null
                }
            });

            e.location.latitude = req.body.latitude;
            e.location.longitude = req.body.longitude;

            e.save(function(err, newEntry) {
                return res.send({
                    success: true
                });
            });
        }
    });
});

router.get('/log/:class/:year/:month/:day', checkForAPIAuth, function(req, res, next) {
    var dt = new Date(req.params.year, (req.params.month - 1), req.params.day, 0, 0, 0, 0);

    var lu = DateUtils.getLowerUpperBoundDate(dt);

    if (req.params.class == 'communication') {
        Communication.findOne({ owner: req.user, date: { $gte: lu.lower, $lte: lu.upper } }, function(err, obj) {
            if (err)
                return res.send({
                    success: false,
                    error: err
                });

            if (obj == null)
                return res.send({
                    success: true,
                    rating: null
                });

            return res.send({
                success: true,
                rating: obj.rating
            });
        });
    }
});

router.post('/log', checkForAPIAuth, function(req, res, next) {
    if (!req.body.class)
        return res.send({
            success: false,
            error: 'Undefined class.'
        });

    if (req.body.class == 'worklog') {
        WorkLog.findOne({
            owner: req.user,
            'date.end': null
        }, function (err, entry) {
            if (entry != null) {
                //  Entry does exist.

                entry.date.end = Date.now();

                entry.save(function (err, newEntry) {
                    return res.send({
                        success: true
                    });
                });
            } else {
                //  Entry does NOT exist.

                var e = new WorkLog({
                    owner: req.user,
                    date: {
                        start: Date.now(),
                        end: null
                    }
                });

                if (_.has(req.body, 'location')) {
                    e.location.latitude = req.body.location.latitude;
                    e.location.longitude = req.body.location.longitude;
                }

                e.save(function (err, newEntry) {
                    return res.send({
                        success: true
                    });
                });
            }
        });
    } else if (req.body.class == 'communication') {
        if (req.body.rating == null)
            return res.send({
                success: false,
                error: 'Missing required argument: "rating".'
            });

        req.user.populate('team', function (err, user) {
            var lu = DateUtils.getLowerUpperBoundDate(Date.now());

            Communication.findOne({owner: user, date: {$gte: lu.lower, $lte: lu.upper}}, function (err, obj) {
                if (err) {
                    return res.send({
                        success: false,
                        error: err
                    });
                }

                if (obj == null)
                    obj = new Communication({
                        owner: user,
                        team: user.team,
                        rating: req.body.rating,
                        date: Date.now()
                    });
                else
                    obj.rating = req.body.rating;

                obj.save(function (err, o) {
                    if (err)
                        return res.send({
                            success: false,
                            error: err
                        });

                    return res.send({
                        success: true
                    });
                });
            });
        });
    } else if (req.body.class == 'interaction') {
        if (req.body.rating == null || req.body.intervenient == null || req.body.duration == null)
            return res.send({
                success: false,
                error: 'Missing required fields!'
            });

        User.findById(req.body.intervenient, function(err, interv) {
           if (err)
               return res.send({
                   success: false,
                   error: err.message
               });

           if (!interv)
               return res.send({
                   success: false,
                   error: 'User not found!'
               });

           var obj = new Interaction({
               owner: req.user,
               rating: req.body.rating,
               intervenient: interv,
               startDate: new Date(Date.now() - req.body.duration * 1000),
               duration: req.body.duration,
               notes: req.body.notes,
               shared: (req.body.shared == "1" ? true : false)
           });

           obj.save(function(err, o) {
               if (err)
                   return res.send({
                       success: false,
                       error: err.message
                   });

               return res.send({
                   success: true,
                   identifier: o.id
               });
           })
        });
    } else
        return res.send({
            success: false,
            error: 'Unknown or invalid class.'
        });
});

router.get('/interact/shared', checkForAPIAuth, function(req, res, next) {
    Interaction.find({ intervenient: req.user, deleted: false }).sort('-startDate').populate('owner').exec(function(err, interactions) {
        if (err)
            return res.send({
                success: false,
                error: err.message
            });

        var ret = [];

        interactions.forEach(function(i) {
            if (i.shared)
                ret.push(i.shareableObject());
        });

        return res.send({
            success: true,
            interactions: ret
        });
    });
});

router.get('/interact/my', checkForAPIAuth, function(req, res, next) {
    Interaction.find({ owner: req.user, deleted: false }).populate('intervenient').exec(function(err, interactions) {
        var ret = [];

        interactions.forEach(function(i) {
            ret.push(i.personalObject());
        });

        return res.send({
            success: true,
            interactions: ret
        });
    });
});

router.post('/interact/:id', checkForAPIAuth, function(req, res, next) {
    Interaction.findById(req.params.id, function(err, interaction) {
        if (err)
            return res.send({
                success: false,
                error: err.message
            });

        if (!interaction)
            return res.send({
                success: false,
                error: 'Interaction not found!'
            });

        interaction.shared = req.body.shared;

        interaction.save(function(err, i) {
            if (err)
                return res.send({
                    success: false,
                    error: err.message
                });

            return res.send({
                success: true
            });
        });
    });
});

router.delete('/interact/:id', checkForAPIAuth, function(req, res, next) {
    Interaction.findById(req.params.id, function(err, interaction) {
        if (err)
            return res.send({
                success: false,
                error: err.message
            });

        if (!interaction)
            return res.send({
                success: false,
                error: 'Interaction not found!'
            });

        interaction.notes = null;
        interaction.shared = false;
        interaction.deleted = true;

        interaction.save(function(err, i) {
            if (err)
                return res.send({
                    success: false,
                    error: err.message
                });

            return res.send({
                success: true
            });
        });
    });
});

router.get('/team/interactions/summary/:year/:month/:day', checkForAPIAuth, function(req, res, next) {
    if (!req.user.team)
        return res.send({
            success: false,
            error: 'No team associated with user.'
        });

    var dates = DateUtils.getLowerUpperBoundDate(new Date(req.params.year, req.params.month - 1, req.params.day, 1, 0, 0));

    var summary = [];

    req.user.populate('team', function(err, user) {
        if (user.team.owner != user.id)
            return res.send({
                success: false,
                error: 'This action can only be performed by the team owner.'
            });

        user.team.getMembers(function(err, members) {
            if (err)
                return res.send({
                    success: false,
                    error: err.message
                });

            var remaining = members.length;

            members.forEach(function(member) {
                Interaction.find({ owner: member, startDate: { $lt: dates.upper, $gt: dates.lower }, duration: { $gte: 120 } })
                    .populate('intervenient').exec(function(err, ins) {
                        if (ins.length) {
                            var sum = 0;

                            ins.forEach(function(i) {
                                sum += i.rating;
                            });

                            summary.push({
                                member: member.getPublicData(),
                                median: sum / ins.length
                            });
                        }

                        if (!--remaining) {
                            return res.send({
                                success: true,
                                summary: summary
                            });
                    }
                });
            });
        });
    });
});

router.get('/team/interactions/detail/:year/:month/:day', checkForAPIAuth, function(req, res, next) {
    if (!req.user.team)
        return res.send({
            success: false,
            error: 'No team associated with user.'
        });

    var dates = DateUtils.getLowerUpperBoundDate(new Date(req.params.year, req.params.month - 1, req.params.day, 1, 0, 0));

    var interactions = [];

    req.user.populate('team', function(err, user) {
        if (user.team.owner != user.id)
            return res.send({
                success: false,
                error: 'This action can only be performed by the team owner.'
            });

        user.team.getMembers(function(err, members) {
            if (err)
                return res.send({
                    success: false,
                    error: err.message
                });

            var remaining = members.length;

            members.forEach(function(member) {
                Interaction.find({ owner: member, startDate: { $lt: dates.upper, $gt: dates.lower }, duration: { $gte: 120 } })
                    .populate('intervenient').exec(function(err, ins) {
                        ins.forEach(function(i) {
                            interactions.push({
                                owner: member.username,
                                intervenient: i.intervenient.username,
                                duration: i.duration,
                                rating: i.rating
                            });
                        });

                        if (!--remaining) {
                            return res.send({
                                success: true,
                                interactions: interactions
                            });
                        }
                });
            });
        });
    });
});

function finishConnection(res, user) {
    user.markModified('connections');

    user.save(function(err, u) {
        if (err)
            return res.send({
                success: false,
                error: err
            });

        return res.send({
            success: true
        });
    });
}

function errMissingRequiredFields(res) {
    return res.send({
        success: false,
        error: 'Missing required fields.'
    })
}

router.get('/connection', checkForAPIAuth, function(req, res, next) {
    var user = req.user;

    var connected = [];

    if (_.has(user.connections, Constants.GITHUB))
        connected.push({
            internal: Constants.GITHUB,
            username: user.connections[Constants.GITHUB].username
        });

    if (_.has(user.connections, Constants.PIVOTAL_TRACKER))
        connected.push({
            internal: Constants.PIVOTAL_TRACKER,
            username: user.connections[Constants.PIVOTAL_TRACKER].username
        });

    if (_.has(user.connections, Constants.BUGZILLA))
        connected.push({
            internal: Constants.BUGZILLA,
            username: user.connections[Constants.BUGZILLA].username
        });

    res.send({
        success: true,
        connections: connected
    });
});

router.get('/connections', checkForAPIAuth, function(req, res, next) {
    res.send({
        success: true,
        connections: [
            {
                name: 'GitHub',
                internal: Constants.GITHUB,
                fields: [
                    {
                        name: 'Username',
                        key: 'conn_username'
                    },
                    {
                        name: 'OAuth2 Token',
                        key: 'conn_token'
                    }
                ],
                tip: null
            },
            {
                name: 'Pivotal Tracker',
                internal: Constants.PIVOTAL_TRACKER,
                fields: [
                    {
                        name: 'Username',
                        key: 'conn_username'
                    },
                    {
                        name: 'API Token',
                        key: 'conn_token'
                    }
                ],
                tip: 'You can get your API token from <a target="_blank" href="https://www.pivotaltracker.com/profile">https://www.pivotaltracker.com/profile</a>.'
            },
            {
                name: 'Bugzilla',
                internal: Constants.BUGZILLA,
                fields: [
                    {
                        name: 'Username',
                        key: 'conn_username'
                    },
                    {
                        name: 'Server',
                        key: 'conn_server'
                    }
                ],
                tip: 'Please make sure all your issues are public (readable without authentication).'
            }
        ]
    })
});

router.post('/connection/:type', checkForAPIAuth, function(req, res, next) {
    var user = req.user;

    if (!user.connections)
        user.connections = {};

    switch (req.params.type) {
        case Constants.GITHUB: {
            if (!req.body.conn_username || !req.body.conn_token)
                return errMissingRequiredFields(res);

            user.connections[Constants.GITHUB] = {
                username: req.body.conn_username,
                token: req.body.conn_token
            };

            return finishConnection(res, user);
        }

        case Constants.PIVOTAL_TRACKER: {
            if (!req.body.conn_token)
                return errMissingRequiredFields(res);

            user.connections[Constants.PIVOTAL_TRACKER] = {
                username: req.body.conn_username,
                token: req.body.conn_token
            };

            return finishConnection(res, user);
        }

        case Constants.BUGZILLA: {
            if (!req.body.conn_server || !req.body.conn_username)
                return errMissingRequiredFields(res);

            user.connections[Constants.BUGZILLA] = {
                server: req.body.conn_server,
                username: req.body.conn_username
            };

            return finishConnection(res, user);
        }

        default: {
            return res.send({
                success: false,
                error: 'Unknown service/connection.'
            });
        }
    }
});

router.delete('/connection/:type', checkForAPIAuth, function(req, res, next) {
    var user = req.user;

    if (_.has(user.connections, req.params.type)) {
        try {
            delete user.connections[req.params.type];
        } catch (e) {
            //  ...
        }

        finishConnection(res, user);
    } else
        return res.send({
            success: false,
            error: 'Connection does not exist.'
        });
});

router.get('/data/since/:year/:month/:day', checkForAPIAuth, function(req, res, next) {
    var user = req.user;

    var gd = new GetData(user);

    var dt = new Date(req.params.year, (req.params.month - 1), req.params.day, 0, 0, 0, 0);

    dt.setHours(0, 0, 0, 0);

    gd.getAcquiredSince(dt, true, function(vars) {
        return res.send({
            success: true,
            data: vars
        });
    });
});

router.get('/data/:year/:month/:day', checkForAPIAuth, function(req, res, next) {
    var user = req.user;

    var gd = new GetData(user);

    var dt = new Date(req.params.year, (req.params.month - 1), req.params.day, 0, 0, 0, 0);

    dt.setHours(0, 0, 0, 0);

    gd.getAcquired(dt, true, function(vars) {
        return res.send({
            success: true,
            data: vars
        });
    });
});

router.get('/data/today', checkForAPIAuth, function(req, res, next) {
    var user = req.user;

    var gd = new GetData(user);

    var dt = new Date();

    dt.setHours(0, 0, 0, 0);

    gd.getAcquired(dt, true, function(vars) {
        return res.send({
            success: true,
            data: vars
        });
    });
});

router.post('/data', function(req, res, next) {
    res.send({
        success: false,
        error: 'Not implemented (yet?).'
    });
});

module.exports = router;
