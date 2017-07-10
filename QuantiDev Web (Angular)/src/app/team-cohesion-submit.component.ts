import { Http } from '@angular/http';
import { Component } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { UserService } from './user.service';
import { TeamCohesionControlService } from './team-cohesion-control.service';

import { DateYMD, QuantiServer } from './quantiserver';

export interface RemoteSprintData {
    cohesion: boolean;
    date: {
        start: DateYMD,
        end: DateYMD
    }
}

@Component({
    selector: 'team-cohesion-submit',
    templateUrl: './team-cohesion-submit.component.html',
    styleUrls: ['./team-cohesion-submit.component.css'],
    providers: [ TeamCohesionControlService ]
})

export class TeamCohesionSubmitComponent {

    statements = [
        {
            label: 'q1',
            statement: 'Our team works together to reach its goals for performance.'
        },
        {
            label: 'q2',
            statement: 'I\'m happy with my team’s level of commitment to the task.'
        },
        {
            label: 'q3',
            statement: 'Everyone in my team wants to achieve the same level of performance.'
        },
        {
            label: 'q4',
            statement: 'I have enough opportunities to improve my personal performance.'
        },
        {
            label: 'q5',
            statement: 'Our team would like to spend time together outside of work hours.'
        },
        {
            label: 'q6',
            statement: 'Members of our team stick together outside of work time.'
        },
        {
            label: 'q7',
            statement: 'Members of our team would go out together as a team.'
        },
        {
            label: 'q8',
            statement: 'For me this team is one of the most important social groups to which I belong.'
        },
        {
            label: 'q9',
            statement: 'Some of my best friends are in this team.'
        }
    ];

    form : FormGroup;

    qs : QuantiServer;

    sprintId : string;
    sprint : RemoteSprintData;

    errored : boolean = false;
    remoteError : string;

    constructor(
        private qcs: TeamCohesionControlService,
        private userService: UserService,
        private http: Http,
        private route: ActivatedRoute,
        private router: Router
    ) {
        this.qs = new QuantiServer(http);
    }

    ngOnInit() {
        this.form = this.qcs.toFormGroup(this.statements);

        this.route.params.subscribe(params => {
            var identifier = params['sprint'];

            this.sprintId = identifier;

            this.qs.getPastSprintSelf(this.userService, identifier).subscribe((result) => {
                if (result)
                    this.sprint = result.sprint;
                else
                    this.errored = true;
            });
        });
    }

    onSubmit() {
        this.qs.submitCohesionReport(this.userService, this.sprintId, this.form.value).subscribe((result) => {
            if (!result.success) {
                this.errored = true;
                this.remoteError = result.error;

                /** http://stackoverflow.com/a/30527650 */

                (function smoothscroll() {
                    var currentScroll = document.documentElement.scrollTop || document.body.scrollTop;
                    if (currentScroll > 0) {
                        window.requestAnimationFrame(smoothscroll);
                        window.scrollTo (0,currentScroll - (currentScroll / 5));
                    }
                })();

                return;
            }

            this.router.navigate(['/team/manage']);
        });
    }

}
