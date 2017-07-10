import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Http } from '@angular/http';

import { UserService } from './user.service';
import { DateYMD, QuantiServer } from './quantiserver';

export interface Report {
    score: {
        total: number;
        task: number;
        social: number;
        attractiveness: number;
    };
    user: string;
    name: string;
}

export interface StartEndDate {
    start: DateYMD,
    end: DateYMD
}

@Component({
    selector: 'team-cohesion-sprint',
    templateUrl: './team-cohesion-sprint.component.html',
    styleUrls: ['./team-cohesion-sprint.component.css']
})

export class TeamCohesionSprintComponent {
    qs : QuantiServer;

    sprintDate : StartEndDate;
    sprintId : string;

    reports : [Report] = null;

    constructor(
        private route: ActivatedRoute,
        private http: Http,
        private userService: UserService,
        private router : Router
    ) {
        this.qs = new QuantiServer(http);
    }

    ngOnInit() {
        var self = this;

        this.route.params.subscribe(params => {
            var identifier = params['sprint'];

            this.sprintId = identifier;

            this.qs.getPastSprintData(this.userService, identifier).subscribe((result) => {
                this.sprintDate = result.sprint.date;
            });

            this.qs.getSprintCohesionSummary(this.userService, identifier).subscribe((result) => {
                if (result.success) {
                    this.reports = result.reports;

                    this.reports.forEach(r => {
                        self.qs.getUserByUsername(self.userService, r.user).subscribe((result) => {
                            r.name = result.user.name;
                        });
                    });
                }
            });
        });
    }
}
