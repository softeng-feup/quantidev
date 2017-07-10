var express = require('express');
var unirest = require('unirest');
var btoa = require('btoa');

var router = express.Router();

var ClientId = 'f66ab49529e41b0a0e9b';
var ClientSecret = 'de59cf2df767ab4ee7d9b72e61d3db5743bf7d4e';

router.get('/github/authenticate/:code/:state', function(req, res, next) {
    unirest.post('https://github.com/login/oauth/access_token')
        .headers({
            'Accept': 'application/json',
            'Authorization': 'Basic ' + btoa(ClientId + ':' + ClientSecret)
        })
        .field({
            code: req.params.code,
            grant_type: 'authorization_code'
        })
        .end(function(response) {
            res.send(response.body);
        });
});

module.exports = router;
