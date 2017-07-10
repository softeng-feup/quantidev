import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Http } from '@angular/http';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

import { UserService } from './user.service';
import { QuantiServer } from './quantiserver';

export interface UserDetails {
    username: string;
    password: string;
}

@Component({
    selector: 'login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})

export class LoginComponent {
    constructor(private userService: UserService, private router: Router, private http: Http) {
        this.qs = new QuantiServer(http);
    }

    invalidLoginDetails = false;

    login : FormGroup;

    qs : QuantiServer;

    ngOnInit() {
        this.login = new FormGroup({
            username: new FormControl(''),
            password: new FormControl('')
        });
    }

    onSubmit({ value, valid }: { value: UserDetails, valid: boolean }) {
        this.invalidLoginDetails = false;

        this.userService.login(value.username, value.password).subscribe((result) => {
            if (result) {
                this.qs.currentTeam(this.userService).subscribe((result) => {
                    this.userService.setHasTeam(result.success);

                    this.qs.teamSettings(this.userService).subscribe((result) => {
                        this.userService.setIsTeamOwner(result.success);

                        this.router.navigate(['']);
                    });
                });
            } else {
                this.invalidLoginDetails = true;
            }
        }, (err) => {
            this.invalidLoginDetails = true;
        });
    }
}
