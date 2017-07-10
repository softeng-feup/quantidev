import { Component, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Http, Headers, URLSearchParams, RequestOptions } from '@angular/http';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

import { ModalDirective } from 'ng2-bootstrap/modal';

import { TeamInfo } from './team';
import { UserService } from './user.service';
import { QuantiServer } from './quantiserver';

export class CreateTeamFormData {
    name: string;
}

@Component({
    selector: 'team-landing',
    templateUrl: './team-landing.component.html',
    styleUrls: ['./team-landing.component.css']
})

export class TeamLandingComponent {
    qs : QuantiServer;
    createTeam : FormGroup;

    teams : TeamInfo[] = [];

    toJoin : TeamInfo = null;

    error : string = null;

    createTeamError : string = null;

    joinKey : string = null;

    @ViewChild('joinTeamClosedModal') public joinTeamClosedModal : ModalDirective;
    @ViewChild('joinTeamOpenModal') public joinTeamOpenModal : ModalDirective;

    constructor(
        private route: ActivatedRoute,
        private http: Http,
        private userService: UserService,
        private router : Router
    ) {
        this.qs = new QuantiServer(http);
    }

    ngOnInit() {
        this.createTeam = new FormGroup({
            name: new FormControl('')
        });

        this.qs.teamListing(this.userService).subscribe((result) => {
            var self = this;

            if (result.success) {
                result.teams.forEach(t => {
                    self.teams.push(t);
                });
            }
        });

        this.qs.currentTeam(this.userService).subscribe((result) => {
            if (result.success == true)
                return this.router.navigate(['/team/manage']);
        });
    }

    onSubmitCreateTeam({ value, valid }: { value: CreateTeamFormData, valid: boolean }) {
        this.createTeamError = null;

        this.qs.createTeam(this.userService, value.name).subscribe((result) => {
            if (result.success) {
                this.userService.setHasTeam(true)
                this.userService.setIsTeamOwner(true);

                this.router.navigate(['team/manage']);
            } else {
                this.createTeamError = result.error;
            }
        });
    }

    join(team: TeamInfo) {
        event.preventDefault();

        this.toJoin = team;

        if (team.open)
            this.joinTeamOpenModal.show();
        else
            this.joinTeamClosedModal.show();
    }

    performJoinTeam(team: TeamInfo, key: string) {
        this.qs.joinTeam(this.userService, team, key).subscribe((result) => {
            this.joinTeamOpenModal.hide();
            this.joinTeamClosedModal.hide();

            if (result.success) {
                this.userService.setHasTeam(true);

                this.router.navigate(['/team/manage']);
            } else {
                this.error = "An error has occurred while attempting to join the selected team. Are you sure the team key is correct?"
            }

            this.joinKey = "";

            // this.joinWithKeyForm.reset();
        });
    }
}
