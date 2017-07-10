var DateTools = require('../util/date');

var ghAPI = require('github');

function GitHub() {

}

function getGitHubInstance() {
    return new ghAPI({
        headers: {
            'user-agent': 'quantiserver/0.1'
        }
    });
}

GitHub.prototype.getEvents = function(user, auth, cb) {
    var gh = getGitHubInstance();

    gh.authenticate({
        type: 'oauth',
        token: auth
    });

    gh.activity.getEventsForUser({
        username: user
    }, function(err, res) {
        cb(res);
    });
};

GitHub.prototype.getCommit = function(user, repository, auth, commit, cb) {
    var gh = getGitHubInstance();

    gh.authenticate({
        type: 'oauth',
        token: auth
    });

    gh.repos.getCommit({
        owner: user,
        repo: repository,
        sha: commit
    }, function(err, res) {
        cb(res);
    });
};

GitHub.prototype._setupEvents = function(count, callback) {
    this.commits = [];
    this.eventsLeft = count;
    this.eventsCallback = callback;
};

GitHub.prototype._useEvent = function() {
    this.eventsLeft--;

    if (this.eventsLeft == 0)
        this.eventsCallback(this.commits);
};

GitHub.prototype._addEvents = function(count) {
    this.eventsLeft += count;
};

GitHub.prototype._addCommit = function(toAdd) {
    if (toAdd != null)
        this.commits.push(toAdd);
};

GitHub.prototype.getTodaysCommits = function(user, token, cb) {
    var self = this;

    this.getEvents(user, token, function(events) {
        self._setupEvents(events.data.length, cb);

        events.data.forEach(function(ev) {
            if (ev.type == 'PushEvent') {
                self._addEvents(ev.payload.commits.length);
                self._useEvent();

                if (ev.payload.commits.length == 0)
                    return;

                ev.payload.commits.forEach(function(c) {
                    var repoNameSplit = ev.repo.name.split('/');

                    self.getCommit(repoNameSplit[0], repoNameSplit[1], token, c.sha, function(commit) {
                        if (commit) {
                            var date = new Date(Date.parse(commit.meta['last-modified']));

                            if (DateTools.isToday(date))
                                self._addCommit(commit);
                        }

                        self._useEvent();
                    });
                });
            } else
                self._useEvent();
        });
    });
};

GitHub.prototype.getTodaysLinesOfCode = function(commits, cb) {
    var count = 0;

    commits.forEach(function(c) {
        count += c.data.stats.total;
    });

    cb(count);
};

module.exports = GitHub;
