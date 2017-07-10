var unirest = require('unirest');

function Weather(/* key */) {
    //  this.key = key;
    this.endpoint = "https://query.yahooapis.com/v1/public/yql?format=json&q=";
}

Weather.prototype.getConditionsFor = function(place, cb) {
    var query = "select * from weather.forecast where woeid in (select woeid from geo.places(1) where text=\"" + place + "\")";

    var encodedQuery = encodeURIComponent(query);

    unirest.get(this.endpoint + encodedQuery)
        .end(function(response) {
            //  cb(response.body.query.results.channel.item.forecast[0].text);

            cb(response.body.query.results.channel.item.forecast[0].code);
        });
};

module.exports = Weather;