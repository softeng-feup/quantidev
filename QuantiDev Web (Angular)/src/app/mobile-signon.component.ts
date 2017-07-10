import { Component } from '@angular/core';

import { Router, ActivatedRoute, Params } from '@angular/router';
import { Http, Headers, URLSearchParams, RequestOptions } from '@angular/http';

import { UserService } from './user.service';

@Component({
    selector: 'mobile-signon',
    template: `
        <div class="alert alert-info" *ngIf="!errored">Logging you in, please wait...</div>
        <div class="alert alert-danger" *ngIf="errored">An error has occurred while attempting to log you in.</div>
    `
})

export class MobileSignOnComponent {

    errored = false

    constructor(private userService: UserService, private http: Http, private router: Router, private activatedRoute: ActivatedRoute) {}

    ngOnInit() {
        this.activatedRoute.queryParams.subscribe((p) => {
            if (p['username'] && p['token']) {
                this.userService.mobileLogin(p['username'], p['token']);
                this.router.navigate(['']);
            } else {
                this.errored = true
            }
        });
    }

}
