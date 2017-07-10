import { Injectable } from '@angular/core';
import { Http, Headers, URLSearchParams, RequestOptions } from '@angular/http';

import { QuantiServer } from './quantiserver';

import 'rxjs/add/operator/map';

@Injectable()
export class UserService {
    private loggedIn = false;

    private _hasTeam = false;
    private _isTeamOwner = false;

    constructor(private http: Http) {
        this.loggedIn = !!localStorage.getItem('token');

        this._hasTeam = localStorage.getItem('hasTeam') == '1';
        this._isTeamOwner = localStorage.getItem('isTeamOwner') == '1';
    }

    login(username, password) {
        var qs = new QuantiServer(this.http);

        return qs.login(username, password).map((res) => {
            if (res.success) {
                localStorage.setItem('name', res.user.name);
                localStorage.setItem('token', res.token);
                localStorage.setItem('username', username);

                this.loggedIn = true;
            }

            return res.success;
        });
    }

    mobileLogin(username, token) {
        localStorage.setItem('username', username);
        localStorage.setItem('token', token);

        this.loggedIn = true;
    }

    name() {
        return localStorage.getItem('name') || this.username();
    }

    username() {
        return localStorage.getItem('username');
    }

    authorizationHeader() {
        return 'QD-TOKEN ' + localStorage.getItem('username') + ';' + localStorage.getItem('token');
    }

    logout() {
        localStorage.removeItem('name');
        localStorage.removeItem('token');
        localStorage.removeItem('username');

        this.loggedIn = false;
    }

    isLoggedIn() {
        return this.loggedIn;
    }

    hasTeam() {
        return this._hasTeam;
    }

    isTeamOwner() {
        return this._isTeamOwner;
    }

    setHasTeam(value: boolean) {
        this._hasTeam = value;

        localStorage.setItem('hasTeam', value ? '1' : '0');
    }

    setIsTeamOwner(value: boolean) {
        this._isTeamOwner = value;

        localStorage.setItem('isTeamOwner', value ? '1' : '0');
    }
}
