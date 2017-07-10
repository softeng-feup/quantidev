import { Component } from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';
import { Http, Headers, URLSearchParams, RequestOptions } from '@angular/http';

import { UserService } from './user.service';
import { QuantiServer, DateYMD } from './quantiserver';

import { IMyOptions, IMyDateRangeModel } from 'mydaterangepicker';

declare var d3;
declare var c3;
declare var moment;

export interface Score {
    total: number;
    task: number;
    social: number;
    attractiveness: number;
}

export interface SimplifiedSprintData {
    date: {
        start: DateYMD,
        end: DateYMD
    };

    id : string;
    cohesion: Score;
}

export interface SimplifiedReportData {
    score: Score;
    user: string;
}

@Component({
    selector: 'team-cohesion-chart',
    templateUrl: './team-cohesion-chart.component.html',
    styleUrls: ['./team-cohesion-chart.component.css']
})

export class TeamCohesionChartComponent {
    fromYear : number;
    fromMonth : number;
    fromDay : number;

    toYear : number;
    toMonth : number;
    toDay : number;

    chart : any;
    chartDates = [];
    chartColumns = [];

    acquiredData : SimplifiedSprintData[];

    dataAvailable = false;
    dataLoading = true;

    members = [];

    qs : QuantiServer;

    private dateRangePickerOptions: IMyOptions = {
        dateFormat: 'dd mmm yyyy',
        width: '300px',
        height: '24px',
        minYear: 2017,
        maxYear: new Date().getFullYear(),
        showClearDateRangeBtn: false
    };

    private dateRangePickerModel: Object;

    constructor(
        private route: ActivatedRoute,
        private http: Http,
        private userService: UserService,
        private router : Router
    ) {
        this.qs = new QuantiServer(http);
    }

    ngOnInit(): void {
        this.route.params.subscribe(params => {
            this.fromYear = +params['fromYear'];
            this.fromMonth = +params['fromMonth'];
            this.fromDay = +params['fromDay'];

            this.toYear = +params['toYear'];
            this.toMonth = +params['toMonth'];
            this.toDay = +params['toDay'];
        });

        this.dateRangePickerModel = {
            beginDate: {
                year: this.fromYear,
                month: this.fromMonth,
                day: this.fromDay
            },
            endDate: {
                year: this.toYear,
                month: this.toMonth,
                day: this.toDay
            }
        };

        this.getTeamMembers();
    }

    onDateRangeChanged(event: IMyDateRangeModel) {
        this.router.navigate(['/team/cohesion/' + event.beginDate.year + '/' + event.beginDate.month + '/' + event.beginDate.day + '/to/' + event.endDate.year + '/' + event.endDate.month + '/' + event.endDate.day]);

        this.fromYear = event.beginDate.year;
        this.fromMonth = event.beginDate.month;
        this.fromDay = event.beginDate.day;

        this.toYear = event.endDate.year;
        this.toMonth = event.endDate.month;
        this.toDay = event.endDate.day;

        this.chartDates = [];
        this.chartColumns = [];

        this.members = [];

        this.getTeamMembers();
    }

    fromDate() : DateYMD {
        return {
            year: this.fromYear,
            month: this.fromMonth,
            day: this.fromDay
        };
    }

    toDate() : DateYMD {
        return {
            year: this.toYear,
            month: this.toMonth,
            day: this.toDay
        }
    }

    buildChart() {
        this.dataLoading = false;

        var self = this;

        setTimeout(function() {
            this.chart = c3.generate({
                x: 'x',
                xFormat: '%Y%m%d',
                bindto: '#chart',
                data: {
                    columns: self.chartColumns,
                    types: {
                        Median: 'spline'
                    },
                    onclick: function(e) {
                        self.router.navigate(['/team/cohesion/' + self.acquiredData[e.x].id]);
                    }
                },
                axis: {
                    x: {
                        tick: {
                            format: function(d) {
                                return self.chartDates[d];
                            }
                        }
                    }
                }
            });
        }, 50);
    }

    getTeamMembers() {
        this.dataLoading = true;

        this.qs.currentTeam(this.userService).subscribe((result) => {
            if (result.success == false)
                return this.router.navigate(['/team']);

            this.members = result.team.members;

            this.getCohesion();
        });
    }

    getCohesion() {
        this.qs.getSprintCohesionSummaryRange(this.userService, this.fromDate(), this.toDate()).subscribe((result) => {
            var self = this;

            if (!result.success || result.sprints.length == 0) {
                this.dataAvailable = false;
                this.dataLoading = false;

                return;
            }

            this.dataAvailable = true;

            this.acquiredData = result.sprints;

            var idx = 0;

            var median : [any] = ['Median'];

            this.acquiredData.forEach(s => {
                self.chartDates.push(s.date.start.month + '/' + s.date.start.day + ' - ' + s.date.end.month + '/' + s.date.end.day);

                median.push(s.cohesion.total);
            });

            self.chartColumns.push(median);

            this.getUserCohesion();
        });
    }

    getUserCohesion() {
        var self = this;

        var userCols = [];

        this.members.forEach(m => {
            var tp = [ m.username ];

            for (var i = 0; i < self.acquiredData.length; i++) {
                tp.push(null);
            }

            userCols.push(tp);
        });

        var remaining = this.acquiredData.length;
        var currentIndex = 1;

        this.acquiredData.forEach(s => {
            var index = currentIndex++;

            self.qs.getSprintCohesionSummary(this.userService, s.id).subscribe((result) => {
                var reports : [SimplifiedReportData] = result.reports;

                reports.forEach(r => {
                    for (var i = 0; i < userCols.length; i++) {
                        if (userCols[i][0] == r.user) {
                            userCols[i][index] = r.score.total;

                            return;
                        }
                    }
                });

                if (!--remaining) {
                    //  Well, we can now draw it.

                    userCols.forEach(uc => {
                        this.chartColumns.push(uc);
                    });

                    this.buildChart();
                }
            });
        });

    }
}
