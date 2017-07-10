import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Http } from '@angular/http';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

import { ModalDirective } from 'ng2-bootstrap/modal';

import { UserService } from './user.service';
import { DateYMD, QuantiServer } from './quantiserver';

export interface OldNewConfirm {
    old : string;
    new : string;
    confirmNew: string;
}

@Component({
    selector: 'settings',
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.css']
})

export class SettingsComponent {
    changePassword : FormGroup;
    changeEmail : FormGroup;
    changeLocation : FormGroup;

    qs : QuantiServer;

    error : string = null;
    location : string = null;

    settingsUpdateSuccess = false;

    @ViewChild('errorModal') public errorModal : ModalDirective;
    @ViewChild('deleteAccountModal') public deleteAccountModal : ModalDirective;

    constructor(
        private userService: UserService,
        private http : Http,
        private router : Router
    ) {
        this.qs = new QuantiServer(http);
    }

    ngOnInit() {
        this.changePassword = new FormGroup({
            old: new FormControl(''),
            new: new FormControl(''),
            confirmNew: new FormControl('')
        });

        this.changeEmail = new FormGroup({
            old: new FormControl(''),
            new: new FormControl(''),
            confirmNew: new FormControl('')
        });

        this.changeLocation = new FormGroup({
            location: new FormControl('')
        });

        this.qs.getUserLocation(this.userService).subscribe((result) => {
            if (result.success)
                this.location = result.location;
        });
    }

    doneChangingSettings() {
        this.settingsUpdateSuccess = true;

        setTimeout(() => {
            this.settingsUpdateSuccess = false;
        }, 4000);
    }

    onSubmitChangePassword({ value, valid } : { value: OldNewConfirm, valid: boolean }) {
        console.log(value);

        if (value.new != value.confirmNew) {
            this.error = 'The inserted passwords do not match!';

            return this.errorModal.show();
        }

        this.qs.changePassword(this.userService, value.old, value.new).subscribe((result) => {
            if (result.success)
                this.doneChangingSettings();
            else {
                this.error = result.error || 'An error has occurred while attempting to perform your request.';

                this.errorModal.show();
            }
        });
    }

    onSubmitChangeEmail({ value, valid } : { value: OldNewConfirm, valid: boolean }) {
        if (value.new != value.confirmNew) {
            this.error = 'The inserted e-mail addresses do not match!';

            return this.errorModal.show();
        }

        this.qs.changeEmail(this.userService, value.old, value.new).subscribe((result) => {
            if (result.success)
                this.doneChangingSettings();
            else {
                this.error = result.error || 'An error has occurred while attempting to perform your request.';

                this.errorModal.show();
            }
        });
    }

    onSubmitChangeLocation({ value, valid } : { value: { location : string }, valid: boolean }) {
        if (!value.location) {
            if (this.location)
                this.error = 'Please insert a different location than the one already in the system.';
            else
                this.error = 'Please insert a location.'

            return this.errorModal.show()
        };

        this.qs.setUserLocation(this.userService, value.location).subscribe((result) => {
            if (result.success)
                this.doneChangingSettings();
            else {
                this.error = result.error || 'An error has occurred while attempting to perform your request.';

                this.errorModal.show();
            }
        });
    }

    deleteAccount() {
        this.deleteAccountModal.hide();

        this.qs.deleteAccount(this.userService).subscribe((result) => {
            if (result.success) {
                this.userService.logout();

                this.router.navigate(['/']);
            } else {
                this.error = result.error || 'An error has occurred while attempting to perform your request.';

                this.errorModal.show();
            }
        });
    }
}
