import { Component } from '@angular/core';

import { Router, ActivatedRoute, Params } from '@angular/router';
import { Http, Headers, URLSearchParams, RequestOptions } from '@angular/http';

import { GitHub } from './github';
import { QuantiServer } from './quantiserver';

import { UserService } from './user.service';

@Component({
    selector: 'connections-gh',
    template: '<div class="alert alert-info">Finishing up the connection with <b>GitHub</b>, please wait...</div>'
})

export class ConnectionsGitHubComponent {

    constructor(private userService: UserService, private http: Http, private router: Router, private activatedRoute: ActivatedRoute) {}

    ngOnInit() {
        this.activatedRoute.queryParams.subscribe((p) => {
            if (p['code']) {
                GitHub.convertToAccessToken(this.http, p['code'])
                    .subscribe((result) => {
                        var token = result.access_token;

                        GitHub.getUsername(this.http, token)
                            .subscribe((result) => {
                                var username = result.login;

                                var qs = new QuantiServer(this.http);

                                qs.setExternalServiceCredential(this.userService, 'github', {
                                    conn_username: username,
                                    conn_token: token
                                }).subscribe((result) => {
                                    if (result.success)
                                        this.router.navigate(['connections']);
                                });
                            }
                        );
                    }
                );
            }
        });
    }

}
