import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Http } from '@angular/http';

import { UserService } from './user.service';
import { DateYMD, QuantiServer } from './quantiserver';

export class InteractionReport {
    owner : string;
    intervenient : string;
    rating : number;
}

@Component({
    selector: 'team-interaction-detail',
    templateUrl: './team-interaction-detail.component.html',
    styleUrls: ['./team-interaction-detail.component.css']
})

export class TeamInteractionDetailComponent {
    qs : QuantiServer;

    datePartDay : number;
    datePartMonth : number;
    datePartYear : number;

    error : boolean;

    interactions : [InteractionReport];

    constructor(
        private route: ActivatedRoute,
        private http: Http,
        private userService: UserService,
        private router : Router
    ) {
        this.qs = new QuantiServer(http);

        this.error = false;
    }

    ngOnInit() {
        this.route.params.subscribe(params => {
            this.datePartYear = +params['year'];
            this.datePartMonth = +params['month'];
            this.datePartDay = +params['day'];
        });

        this.qs.getInteractionsDetailDay(this.userService, this.date()).subscribe((result) => {
            if (result.success) {
                this.interactions = result.interactions;

                this.interactions.forEach(i => {
                    this.qs.getUserByUsername(this.userService, i.owner).subscribe((result) => {
                        if (result.success)
                            i.owner = result.user.name;
                    });

                    this.qs.getUserByUsername(this.userService, i.intervenient).subscribe((result) => {
                        if (result.success)
                            i.intervenient = result.user.name;
                    });
                });

                if (!this.interactions.length)
                    this.error = true;
            } else {
                this.error = true;
            }
        });
    }

    date() : DateYMD {
        return {
            year: this.datePartYear,
            month: this.datePartMonth,
            day: this.datePartDay
        };
    }

    emoji(rating: number) : string {
        switch (rating) {

            case 1:
                return "😟";

            case 2:
                return "🙁";

            case 3:
                return "😶";

            case 4:
                return "😀";

            case 5:
                return "😁";

            default:
                return "";

        }
    }
}
