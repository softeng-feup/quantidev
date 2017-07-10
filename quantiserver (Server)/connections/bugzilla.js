var _ = require('lodash');
var unirest = require('unirest');

var DateTools = require('../util/date');

function Bugzilla(appURL) {
    this.endpoint = '';
    this.appURL = appURL;
    this.workaroundMethodCGI = false;

    this.buildEndpoint();
}

Bugzilla.prototype.buildEndpoint = function() {
    if (this.appURL.substr(0, 4) != 'http')
        this.endpoint = 'http://' + this.appURL;
    else
        this.endpoint = this.appURL;

    //  Some servers may answer at /rest, others at /rest.cgi, depending on
    //  their configuration. We should be able to handle both.

    this.endpoint += (this.workaroundMethodCGI ? '/rest.cgi/' : '/rest/');
};

Bugzilla.prototype.tryOtherMethod = function() {
    this.workaroundMethodCGI = true;

    this.buildEndpoint();
};

Bugzilla.prototype.getAssignedBugs = function(user, cb) {
    var self = this;

    var uri = this.endpoint + 'bug?assigned_to=' + user;

    unirest.get(uri)
        .end(function(response) {
            if (response.statusCode != 200) {
                if (!self.workaroundMethodCGI) {
                    self.tryOtherMethod();

                    self.getAssignedBugs(user, cb);
                }
            } else {
                if (response.body)
                    cb(response.body.bugs);
            }
        }
    );
};

Bugzilla.prototype.getBugsResolvedToday = function(user, cb) {
    this.getAssignedBugs(user, function(bugs) {
        var count = 0;

        bugs.forEach(function(bug) {
            var date = null;

            if (_.has(bug, 'cf_last_resolved')) {
                //  If cf_last_resolved is implemented...

                if (bug.cf_last_resolved == null)
                    return;

                date = new Date(Date.parse(bug.cf_last_resolved));
            } else if (bug.is_open == true)
                //  Else, there's the next big thing.

                return;
            else
                date = new Date(Date.parse(bug.last_change_time));

            if (!DateTools.isToday(new Date(Date.parse(date))))
                return;

            count++;
        });

        cb(count);
    });
};

module.exports = Bugzilla;
