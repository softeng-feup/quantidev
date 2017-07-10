import { Http, Headers, URLSearchParams, RequestOptions } from '@angular/http';

import { environment } from '../environments/environment';

export class GitHub {

    private static AuthorizeURL = 'https://github.com/login/oauth/authorize';
    private static AccessTokenURL = environment.proxy + 'github/authenticate/';
    private static AuthenticatedUserURL = 'https://api.github.com/user';

    private static ClientId = 'f66ab49529e41b0a0e9b';
    private static Scopes = 'repo';

    private static requestHeaders() {
        let headers = new Headers();

        headers.append('Accept', 'application/vnd.github.v3+json');

        return headers;
    }

    static buildBeginOAuthFlowURL() {
        /** https://www.thepolyglotdeveloper.com/2015/03/create-a-random-nonce-string-using-javascript/ */

        var randomString = function(length) {
            var text = "";
            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

            for (var i = 0; i < length; i++)
                text += possible.charAt(Math.floor(Math.random() * possible.length));

            return text;
        }

        var state = randomString(12);

        localStorage.setItem('ghstate', state);

        return GitHub.AuthorizeURL + "?client_id=" + GitHub.ClientId + "&scope="  + GitHub.Scopes + "&state" + state;
    }

    static convertToAccessToken(http: Http, token: string) {
        var state = localStorage.getItem('ghstate');

        localStorage.removeItem('ghstate');

        return http
            .get(GitHub.AccessTokenURL + token + '/' + state)
            .map(res => res.json()
        );
    }

    static getUsername(http: Http, token: string) {
        let headers = new Headers();

        headers.set('Authorization', 'token ' + token);

        let params = new URLSearchParams();

        params.set('username', '');
        params.set('password', '');

        return http
            .get(
                GitHub.AuthenticatedUserURL,
                { search: params, headers: headers }
            ).map(res => res.json()
        );
    }

}
