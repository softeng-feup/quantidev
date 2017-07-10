import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Http } from '@angular/http';

import { UserService } from './user.service';

import { QuantiServer } from './quantiserver';

declare var moment;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {

    today = new Date();
    weekAgo : Date;

    qs : QuantiServer;

    constructor(private userService: UserService, private http: Http, private router: Router) {
        this.weekAgo = moment(this.today).subtract(1, 'week').toDate();

        this.qs = new QuantiServer(http);
    }

    ngOnInit() {
        this.qs.currentTeam(this.userService).subscribe((result) => {
            this.userService.setHasTeam(result.success);

            this.qs.teamSettings(this.userService).subscribe((result) => {
                this.userService.setIsTeamOwner(result.success);
            });
        });
    }

    logout() {
        this.userService.logout();

        this.router.navigate(['/']);
    }

    title = 'QuantiDev';
}
