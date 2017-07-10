import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Http, Headers, URLSearchParams, RequestOptions } from '@angular/http';
import { Location } from '@angular/common';

import { IMyOptions, IMyDateModel } from 'mydatepicker';

import { QuantiServer } from './quantiserver';

import { UserService } from './user.service';

import 'rxjs/add/operator/map';

@Component({
  selector: 'team-detail-day',
  templateUrl: './team-detail-day.component.html',
  styleUrls: [ './team-detail-day.component.css' ]
})

export class TeamDetailDayComponent implements OnInit {
    year : number;
    month : number;
    day : number;

    qs : QuantiServer;

    userCount : number;
    users: Map<string, string> = new Map<string, string>();

    atLeastWorkplace : string = "Loading...";
    allMembersWorkplace : string = "Loading...";

    private datePickerOptions: IMyOptions = {
        dateFormat: 'dd mmm yyyy',
        width: '200px',
        height: '24px',
        minYear: 2017,
        maxYear: new Date().getFullYear(),
        showClearDateBtn: false
    };

    private datePickerModel: Object;

    constructor(
        private route: ActivatedRoute,
        private http: Http,
        private userService: UserService,
        private router : Router
    ) {
        this.qs = new QuantiServer(this.http);
    }

    public timelineChartOptions : any;

    ngOnInit(): void {
        this.route.params.subscribe(params => {
            this.year = +params['year'];
            this.month = +params['month'];
            this.day = +params['day'];

            this.datePickerModel = {
                date: {
                    year: this.year,
                    month: this.month,
                    day: this.day
                }
            };

            this.getChartData();
        });
    }

    onDateChanged(event: IMyDateModel) {
        this.router.navigate(['/team/detail/' + event.date.year + '/' + event.date.month + '/' + event.date.day]);

        this.year = event.date.year;
        this.month = event.date.month;
        this.day = event.date.day;

        this.datePickerModel = {
            date: {
                year: this.year,
                month: this.month,
                day: this.day
            }
        };
    }

    getChartData() {
        var date = {
            year: this.year,
            month: this.month,
            day: this.day
        };

        this.qs.getTeamMetric(this.userService, date).subscribe((res) => {
            if (res.success) {
                this.atLeastWorkplace = new Date(res.metric.union * 1000).toISOString().substr(11, 8);
                this.allMembersWorkplace = new Date(res.metric.intersect * 1000).toISOString().substr(11, 8);
            }

            return res.success;
        });

        this.qs.getTeamDetail(this.userService, date).subscribe((result) => {
            if (result) {
                this.userCount = result.detail.length;

                for (var r in result.detail) {
                    var d = result.detail[r];

                    this.qs.getUserById(this.userService, d.member).subscribe((innerRes) => {
                        this.users.set(innerRes.user.id, innerRes.user.username);

                        if (this.users.size == this.userCount)
                            this.buildChart(result);
                    });
                }
            }
        });
    }

    buildChart(result) {
        var self = this;
        var rows = [];

        rows.push([ 'Team Member', 'Start', 'End' ]);

        var allNames = [];
        var reversedMap = new Map<string, string>();

        self.users.forEach(function(value, key) {
            allNames.push(value);
            reversedMap.set(value, key);
        });

        allNames.sort(function(a, b) {
            var nameA = a.toUpperCase();
            var nameB = b.toUpperCase();

            if (nameA < nameB)
                return -1;

            if (nameA > nameB)
                return 1;

            return 0;
        });

        allNames.forEach(function(name) {
            result.detail.forEach(function(r) {
                var member = self.users.get(r.member);

                if (member != name)
                    return;

                r.times.forEach(function(t) {
                    if (t.end)
                        rows.push([member, new Date(Date.parse(t.start)), new Date(Date.parse(t.end))]);
                });
            });
        });

        if (rows.length == 1)
            this.userCount = 0;

        this.timelineChartOptions = {
            chartType: 'Timeline',
            dataTable: rows
        }
    }

    reloadData() {
        this.userCount = 0;
        this.users = new Map<string, string>();

        this.atLeastWorkplace = "Loading...";
        this.allMembersWorkplace = "Loading...";

        this.getChartData();
    }
}
