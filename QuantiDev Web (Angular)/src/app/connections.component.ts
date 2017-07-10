import { Component, ViewChild } from '@angular/core';
import { Http, Headers, RequestOptions } from '@angular/http';
import { Router } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

import { ModalDirective } from 'ng2-bootstrap/modal';

import { Service, Connection } from './connection';
import { UserService } from './user.service';

import { GitHub } from './github';
import { QuantiServer } from './quantiserver';

@Component({
    selector: 'connections',
    templateUrl: './connections.component.html',
    styleUrls: ['./connections.component.css']
})

export class ConnectionsComponent {
    services : Service[] = [];
    connections : Connection[] = [];

    addConnectionForm : FormGroup = new FormGroup({
        field1: new FormControl(''),
        field2: new FormControl('')
    });

    toConnect : Service;
    toDisconnect : Connection;

    qs : QuantiServer;

    error : String = null;

    @ViewChild('addConnectionModal') public addConnectionModal : ModalDirective;
    @ViewChild('disconnectModal') public disconnectModal : ModalDirective;

    constructor(private userService: UserService,
                private http: Http,
                private router: Router)
        {
            this.qs = new QuantiServer(http);
        }

    ngOnInit() {
        this.qs.getExternalServices(this.userService).subscribe((result) => {
            if (result.success) {
                var self = this;

                result.connections.forEach(function(c) {
                    self.services.push(c);
                });
            }

            this.refreshConnections();
        });
    }

    refreshConnections() {
        this.connections = [];

        this.qs.getConnectedServices(this.userService).subscribe((result) => {
            if (result.success) {
                var self = this;

                result.connections.forEach(function(c) {
                    self.services.forEach(function(service) {
                        if (service.internal == c.internal) {
                            self.connections.push({
                                service: service,
                                username: c.username,
                                valid: true
                            });
                        }
                    });
                });

                if (self.connections.length != self.services.length) {
                    self.services.forEach(function(service) {
                        var found : boolean = false;

                        self.connections.forEach(function(connection) {
                            if (!found)
                                if (service.internal == connection.service.internal)
                                    found = true;
                        });

                        if (!found)
                            self.connections.push({
                                service: service,
                                username: null,
                                valid: false
                            });
                    });
                }
            }
        });
    }

    onConnectSubmit({ value, valid } : { value: Object, valid: boolean }) {
        this.addConnectionModal.hide();

        var req = {};

        req[this.toConnect.fields[0].key] = value['field1'];
        req[this.toConnect.fields[1].key] = value['field2'];

        var qs = new QuantiServer(this.http);

        qs.setExternalServiceCredential(this.userService, this.toConnect.internal, req)
            .subscribe((result) => {
                this.error = null;

                if (result.success)
                    this.refreshConnections();
                else
                    this.error = result.error;
            }, (err) => {
                this.error = err;
            });

        this.addConnectionForm.reset();
    }

    connect(service: Service) {
        event.preventDefault();

        if (service.internal == 'github') {
            window.location.href = GitHub.buildBeginOAuthFlowURL();
        } else {
            this.toConnect = service;

            this.addConnectionModal.show();
        }
    }

    disconnect(connection: Connection) {
        event.preventDefault();

        this.toDisconnect = connection;

        this.disconnectModal.show();
    }

    performDisconnection(connection: Connection) {
        this.error = null;

        this.disconnectModal.hide();

        var qs = new QuantiServer(this.http);

        qs.removeExternalServiceCredential(this.userService, connection.service.internal)
            .subscribe((result) => {
                this.refreshConnections();
            });
    }
}
