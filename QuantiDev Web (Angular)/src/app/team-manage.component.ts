import { Component, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Http } from '@angular/http';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

import { IMyOptions, IMyDateModel } from 'mydatepicker';

import { ModalDirective } from 'ng2-bootstrap/modal';

import { TeamInfo } from './team';
import { UserService } from './user.service';
import { DateYMD, QuantiServer } from './quantiserver';

import { Coordinates } from './coordinates';

declare var moment;

export interface GeneralSettings {
    name : string;
    latitude : string;
    longitude : string;
}

export interface RemoteSprintSettings {
    length: number;
    date: DateYMD;
}

export interface SprintSettings {
    length: number;
    date: {
        date: DateYMD
    };
}

export interface RemotePastSprints {
    id: string;
    date: {
        start: DateYMD,
        end: DateYMD
    };
    cohesion: boolean;
}

@Component({
    selector: 'team-manage',
    templateUrl: './team-manage.component.html',
    styleUrls: ['./team-manage.component.css']
})

export class TeamManageComponent {
    qs : QuantiServer;
    team : TeamInfo;

    code : string;
    openAll : boolean;

    changeGeneralSettings : FormGroup;
    changeSprintSettings : FormGroup;

    loading : boolean = true;
    owner : boolean = null;
    members = [];

    generalSettingsUpdateSuccess : boolean = false;

    gettingLocation : boolean = false;

    error : string = null;

    sprint : RemoteSprintSettings = null;

    nextSprintStartDate : DateYMD = null;

    pastSprints : [RemotePastSprints] = null;

    workplace : Coordinates = {
        latitude: null,
        longitude: null
    };

    private datePickerOptions: IMyOptions = {
        dateFormat: 'dd mmm yyyy',
        minYear: 2017,
        maxYear: new Date().getFullYear(),
        showClearDateBtn: false
    };

    private datePickerModel: Object;

    @ViewChild('leaveTeamModal') public leaveTeamModal : ModalDirective;
    @ViewChild('errorModal') public errorModal : ModalDirective;
    @ViewChild('destroyTeamModal') public destroyTeamModal : ModalDirective;

    constructor(
        private route: ActivatedRoute,
        private http: Http,
        private userService: UserService,
        private router : Router
    ) {
        this.qs = new QuantiServer(http);
    }

    ngOnInit() {
        this.changeGeneralSettings = new FormGroup({
            name: new FormControl(''),
            latitude: new FormControl(''),
            longitude: new FormControl('')
        });

        this.changeSprintSettings = new FormGroup({
            length: new FormControl(''),
            date: new FormControl('')
        });

        var now = new Date();

        this.datePickerModel = {
            date: {
                year: now.getFullYear(),
                month: now.getMonth() + 1,
                day: now.getDate()
            }
        };

        this.loadTeamGeneralData();
        this.loadSprintSettings();

        this.qs.teamSettings(this.userService).subscribe((result) => {
            this.owner = result.success;

            if (this.team)
                this.loading = false;

            if (result.success) {
                this.code = result.settings.joinKey;
                this.openAll = result.settings.open;
            }
        });

        this.qs.teamWorkplaceCoordinates(this.userService).subscribe((result) => {
            if (result.success) {
                this.workplace.latitude = result.workplace.latitude;
                this.workplace.longitude = result.workplace.longitude;
            }
        });

        this.qs.getPastSprintsSelf(this.userService).subscribe((result) => {
            if (result.success) {
                this.pastSprints = result.sprints;
            }
        });
    }

    loadTeamGeneralData() {
        this.qs.currentTeam(this.userService).subscribe((result) => {
            if (result.success == false)
                return this.router.navigate(['/team']);

            this.team = result.team.details;
            this.members = result.team.members;

            if (this.owner !== null)
                this.loading = false;
        });
    }

    loadSprintSettings() {
        this.qs.getSprintData(this.userService).subscribe((result) => {
            if (result.success == false)
                return;

            this.sprint = result.sprint;

            var pastDate = new Date(this.sprint.date.year, this.sprint.date.month - 1, this.sprint.date.day);

            var nextDate = moment(pastDate).add(this.sprint.length, 'days').toDate();

            this.nextSprintStartDate = {
                year: nextDate.getFullYear(),
                month: nextDate.getMonth() + 1,
                day: nextDate.getDate()
            };
        });
    }

    doneChangingGeneralSettings() {
        this.generalSettingsUpdateSuccess = true;

        setTimeout(() => {
            this.generalSettingsUpdateSuccess = false;
        }, 4000);
    }

    onSubmitChangeGeneralSettings({ value, valid } : { value: GeneralSettings, valid: boolean }) {
        var remaining = 1;

        if (value.name && (value.latitude || value.longitude))
            remaining++;

        if (!value.name && !(value.latitude || value.longitude))
            return this.doneChangingGeneralSettings();

        if (value.name) {
            this.qs.changeTeamName(this.userService, value.name).subscribe((result) => {
                if (result.success) {
                    this.team.name = value.name;

                    if (!--remaining)
                        this.doneChangingGeneralSettings();
                } else {
                    this.error = result.error;

                    this.errorModal.show();
                }
            });
        }

        if (value.latitude || value.longitude) {
            var lat = value.latitude || this.workplace.latitude;
            var lng = value.longitude || this.workplace.longitude;

            if (!lat || !lng) {
                this.error = 'Missing required coordinate values!';

                this.errorModal.show();

                return;
            }

            this.qs.changeTeamCoordinates(this.userService, {
                latitude: Number(lat),
                longitude: Number(lng)
            }).subscribe((result) => {
                if (!--remaining)
                    this.doneChangingGeneralSettings();
            });
        }
    }

    geolocateUser() {
        if (navigator.geolocation) {
            this.gettingLocation = true;

            navigator.geolocation.getCurrentPosition(pos => {
                this.gettingLocation = false;

                this.workplace.latitude = pos.coords.latitude;
                this.workplace.longitude = pos.coords.longitude;

                this.changeGeneralSettings.controls['latitude'].setValue(pos.coords.latitude);
                this.changeGeneralSettings.controls['longitude'].setValue(pos.coords.longitude);
            }, err => {
                this.gettingLocation = false;

                switch (err.code) {
                    case 1:
                        this.error = 'The geolocation request was denied.';

                        break;

                    case 2:
                        this.error = 'Unable to acquire your current location.';

                        break;

                    case 3:
                        this.error = 'The request for geolocation has timed out.';

                        break;

                    default:
                        this.error = 'A generic error has occurred.';

                        break;
                }

                this.errorModal.show();
            });
        } else {
            this.error = 'Your browser does not support geolocation.';

            this.errorModal.show();
        }
    }

    onSubmitChangeSprintSettings({ value, valid } : { value: SprintSettings, valid: boolean }) {
        if (value.length < 1) {
            this.error = 'Invalid sprint length!';

            this.errorModal.show();

            return;
        }

        if (!value.date) {
            this.error = 'A sprint start date is required!';

            this.errorModal.show();

            return;
        }

        var curDate = new Date();

        var selDate = new Date(value.date.date.year, value.date.date.month - 1, value.date.date.day);

        if ((curDate.getTime() - selDate.getTime()) / 1000 > (value.length * 60 * 60 * 24)) {
            this.error = 'Invalid sprint start date!';

            this.errorModal.show();

            return;
        }

        this.qs.setupSprint(this.userService, value.length, value.date.date).subscribe((result) => {
            this.loadSprintSettings();
        });
    }

    openChanged() {
        this.qs.changeTeamOpenToEveryone(this.userService, this.openAll).subscribe((result) => {

        });
    }

    makeLeader(username: string) {
        event.preventDefault();

        this.qs.changeTeamLeader(this.userService, username).subscribe((result) => {
            if (result.success) {
                this.userService.setIsTeamOwner(false);

                window.location.reload();
            } else {
                this.error = result.error;

                this.errorModal.show();
            }
        });
    }

    kick(username: string) {
        event.preventDefault();

        this.qs.removeTeamMember(this.userService, username).subscribe((result) => {
            if (result.success)
                this.loadTeamGeneralData();
            else {
                this.error = result.error;

                this.errorModal.show();
            }
        });
    }

    reGenerateInviteCode() {
        event.preventDefault();

        this.qs.regenerateTeamInviteCode(this.userService).subscribe((result) => {
            if (result.success)
                this.code = result.key;
        });
    }

    leaveTeam() {
        this.leaveTeamModal.show();
    }

    performLeaveTeam() {
        this.qs.leaveTeam(this.userService).subscribe((result) => {
            this.userService.setHasTeam(false);

            this.router.navigate(['/team']);
        });
    }

    destroyTeam() {
        this.destroyTeamModal.show();
    }

    performDestroyTeam() {
        this.qs.destroyTeam(this.userService).subscribe((result) => {
            if (result.success) {
                this.userService.setHasTeam(false);
                this.userService.setIsTeamOwner(false);

                this.router.navigate(['/team']);
            } else {
                this.error = result.error;

                this.errorModal.show();
            }
        });
    }
}
