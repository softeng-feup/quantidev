import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Http, Headers, URLSearchParams, RequestOptions } from '@angular/http';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

import { ModalDirective } from 'ng2-bootstrap/modal';

import { QuantiServer } from './quantiserver';

export interface SignupDetails {
    name: string;
    username: string;
    password: string;
    email: string;
}

@Component({
  selector: 'signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})

export class SignupComponent {
    signup : FormGroup;

    @ViewChild('errorModal') public errorModal : ModalDirective;

    modalTitle : string;
    modalDetail : string;

    registeried : boolean = false;

    constructor(private http: Http) {}

    ngOnInit() {
        this.signup = new FormGroup({
            name: new FormControl(''),
            username: new FormControl(''),
            password: new FormControl(''),
            email: new FormControl('')
        });
    }

    onSubmit({ value, valid }: { value: SignupDetails, valid: boolean }) {
        var qs = new QuantiServer(this.http);

        qs.signup(value.name, value.username, value.password, value.email).subscribe((result) => {
            this.registeried = result.success;

            if (!result.success) {
                this.modalTitle = "Error!"
                this.modalDetail = result.error;

                this.errorModal.show();
            }

            return result.success;
        });
    }
}
