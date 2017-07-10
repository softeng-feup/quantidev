var SALT_WORK_FACTOR = 10;

var mongoose = require('mongoose');
var bcrypt = require('bcrypt');

const crypto = require('crypto-extra');

var DateUtils = require('../util/date');

var Communication = require('./communication');

var UserSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true, trim: true },
    tokens: [ {
        token: { type: String, required: true },
        created: { type: Date, required: true, default: Date.now }
    } ],
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    teamMemberSince: { type: Date },
    pastTeams: [
        {
            team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
            timeframe: {
                start: Date,
                end: Date
            }
        }
    ],
    location: { type: String },
    connections: {}
});

UserSchema.pre('save', function(next) {
    var user = this;

    if (!user.isModified('password'))
        return next();

    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
        if (err)
            return next(err);

        bcrypt.hash(user.password, salt, function(err, hash) {
            if (err)
                return next(err);

            user.password = hash;

            next();
        });
    });
});

UserSchema.methods.comparePassword = function(candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
        if (err)
            return cb(err);

        cb(null, isMatch);
    });
};

UserSchema.methods.generateToken = function(cb) {
    var generated = crypto.randomString(32);

    this.tokens.push({
        token: generated
    });

    this.markModified('tokens');

    this.save(function(err, newUser) {
        if (err)
            return cb(err, null);

        return cb(null, generated);
    });
};

UserSchema.methods.logout = function(token) {
    var idx = this.tokens.indexOf({
        token: token
    });

    if (idx == -1)
        return console.error('Couldn\'t logout ' + token + '!');

    this.tokens.splice(idx, 1);

    this.markModified('tokens');

    this.save(null);
};

UserSchema.methods.getPublicData = function() {
    return {
        id: this.id,
        name: this.name,
        username: this.username,
        team: this.team
    }
};

UserSchema.methods.communicationHealthForDay = function(day, cb) {
    var dt = DateUtils.getLowerUpperBoundDate(day);

    Communication.findOne({ owner: this, date: { $gte: dt.lower, $lte: dt.upper }}, function(err, comm) {
        cb(comm);
    });
};

UserSchema.methods.joinTeam = function(team, cb) {
    this.teamMemberSince = Date.now();
    this.team = team;

    this.save(function(err, newUser) {
        cb(err == null);
    });
};

UserSchema.methods.leaveTeam = function(cb) {
    this.pastTeams.push({
        team: this.team,
        timeframe: {
            start: this.teamMemberSince,
            end: Date.now()
        }
    });

    this.teamMemberSince = null;
    this.team = null;

    this.markModified('pastTeams');

    this.save(function(err, newUser) {
        cb(!err);
    });
};

UserSchema.methods.prepareForDeletion = function(cb) {
    var self = this;

    this.leaveTeam(function(err) {
        //  Delete all related data...

        var Cohesion = require('./cohesion');
        var Commits = require('./commits');
        var Communication = require('./communication');
        var Interaction = require('./interaction');
        var Issues = require('./issues');
        var Lines = require('./lines');
        var StoryPoints = require('./storypoints');
        var WorkLog = require('./worklog');

        Cohesion.find({ owner: self }).remove().exec(function(err) {
            if (err)
                return cb(err);

            Commits.find({ owner: self }).remove().exec(function(err) {
                if (err)
                    return cb(err);

                Communication.find({ owner: self }).remove().exec(function(err) {
                    if (err)
                        return cb(err);

                    Interaction.find({ owner: self }).remove().exec(function(err) {
                        if (err)
                            return cb(err);

                        Issues.find({ owner: self }).remove().exec(function(err) {
                            if (err)
                                return cb(err);

                            Lines.find({ owner: self }).remove().exec(function(err) {
                                if (err)
                                    return cb(err);

                                StoryPoints.find({ owner: self }).remove().exec(function(err) {
                                    if (err)
                                        return cb(err);

                                    WorkLog.find({ owner: self }).remove().exec(function(err) {
                                        if (err)
                                            return cb(err);

                                        //  This should be it.

                                        return cb(null);
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
};

module.exports = mongoose.model('User', UserSchema);
