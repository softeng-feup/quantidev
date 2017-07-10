var tracker = require('pivotaltracker');
var unirest = require('unirest');

var DateTools = require('../util/date');

function PivotalTracker(key) {
    this.apiKey = key;
    this.client = new tracker.Client(key);

    this.currentSum = 0;
    this.leftToSum = 0;
}

PivotalTracker.prototype.getUserIdentifier = function(callback) {
    unirest.get('https://www.pivotaltracker.com/services/v5/me?fields=%3Adefault')
        .headers({'X-TrackerToken': this.apiKey})
        .end(function(response) {
            callback(response.body.id);
        }
    );
}

PivotalTracker.prototype.setupStoryPointSum = function(count) {
    this.currentSum = 0;
    this.leftToSum = count;
}

PivotalTracker.prototype.sumStoryPoints = function(toSum, callback) {
    this.currentSum += toSum;
    this.leftToSum--;

    if (this.leftToSum == 0)
        callback(this.currentSum);
}

PivotalTracker.prototype.getStoryPoints = function(userId, day, cb) {
    var self = this;

    var client = new tracker.Client(this.apiKey);

    client.projects.all(function(error, projects) {
        self.setupStoryPointSum(projects.length);

        projects.forEach(function(p) {
            client.project(p.id).stories.all(function(error, stories) {
                var points = 0;

                stories.forEach(function(s) {
                    if (s.ownedById == userId) {
                        if (s.currentState == 'finished' ||
                            s.currentState == 'delivered' ||
                            s.currentState == 'accepted' ||
                            s.currentState == 'rejected') {
                            if (!DateTools.isToday(new Date(Date.parse(s.updatedAt))))
                                return;

                            points += s.estimate;
                        }
                    }
                });

                self.sumStoryPoints(points, cb);
            });
        });
    });
}

module.exports = PivotalTracker;
