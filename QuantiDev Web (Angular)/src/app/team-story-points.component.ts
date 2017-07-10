import { Component } from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';
import { Http, Headers, URLSearchParams, RequestOptions } from '@angular/http';

import { UserService } from './user.service';
import { QuantiServer, DateYMD } from './quantiserver';

import { IMyOptions, IMyDateRangeModel } from 'mydaterangepicker';

declare var d3;
declare var c3;
declare var moment;

@Component({
    selector: 'team-story-points',
    templateUrl: './team-story-points.component.html',
    styleUrls: ['./team-story-points.component.css']
})

export class TeamStoryPointsComponent {
    fromYear : number;
    fromMonth : number;
    fromDay : number;

    toYear : number;
    toMonth : number;
    toDay : number;

    chart : any;
    chartDates = [];
    chartColumns = [];

    acquiredData = [];
    acquiredUsernames = [];
    acquiredMembersObj = {};

    qs : QuantiServer;

    dataAvailable = false;
    dataLoading = true;

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

        this.getTeamData({
            year: this.fromYear,
            month: this.fromMonth,
            day: this.fromDay
        }, {
            year: this.toYear,
            month: this.toMonth,
            day: this.toDay
        });
    }

    onDateRangeChanged(event: IMyDateRangeModel) {
        this.router.navigate(['/team/sp/' + event.beginDate.year + '/' + event.beginDate.month + '/' + event.beginDate.day + '/to/' + event.endDate.year + '/' + event.endDate.month + '/' + event.endDate.day]);

        this.fromYear = event.beginDate.year;
        this.fromMonth = event.beginDate.month;
        this.fromDay = event.beginDate.day;

        this.toYear = event.endDate.year;
        this.toMonth = event.endDate.month;
        this.toDay = event.endDate.day;

        this.cleanData();
        this.loadData();
    }

    cleanData() {
        this.chartDates = [];
        this.chartColumns = [];

        this.acquiredData = [];
        this.acquiredUsernames = [];
        this.acquiredMembersObj = {};
    }

    loadData() {
        this.dataLoading = true;

        this.getTeamData({
            year: this.fromYear,
            month: this.fromMonth,
            day: this.fromDay
        }, {
            year: this.toYear,
            month: this.toMonth,
            day: this.toDay
        });
    }

    hasData() {
        for (var i = 0; i < this.chartColumns.length; i++)
            for (var j = 1; j < this.chartColumns[i].length; j++)
                if (this.chartColumns[i][j] != null)
                    return true;

        return false;
    }

    buildChart() {
        this.dataLoading = false;
        this.dataAvailable = this.hasData();

        var self = this;

        setTimeout(function() {
            self.chart = c3.generate({
                x: 'x',
                xFormat: '%Y%m%d',
                bindto: '#chart',
                data: {
                    columns: self.chartColumns,
                    types: {
                        Median: 'spline'
                    }
                },
                axis: {
                    x: {
                        label: 'Date',
                        tick: {
                            format: function(d) {
                                return self.chartDates[d];
                            }
                        }
                    },
                    y: {
                        label: 'Story Points'
                    }
                }
            });
        }, 50);
    }

    getTeamData(from: DateYMD, to: DateYMD) {
        var self = this;

        this.qs.currentTeam(this.userService).subscribe((result) => {
            result.team.members.forEach(function(m) {
                self.acquiredUsernames.push(m.username);
                self.acquiredMembersObj[m.id] = m.username;
            });

            var beg : any = new Date(from.year, from.month - 1, from.day, 0, 0, 0, 0);
            var end = new Date(to.year, to.month - 1, to.day, 0, 0, 0, 0);

            var dates : [Date] = [beg];

            this.chartDates.push(moment(beg).format('DD-MM-YYYY'));

            while (beg < end) {
                beg = moment(beg).add(1, 'day');

                this.chartDates.push(beg.format('DD-MM-YYYY'));

                beg = beg.toDate();

                dates.push(beg);
            }

            var index = 0;

            dates.forEach(function(d) {
                self.acquiredData.push(null);

                self.getStoryPointsData(self.acquiredMembersObj, index++, {
                    year: d.getFullYear(),
                    month: d.getMonth() + 1,
                    day: d.getDate()
                });
            });
        });
    }

    getStoryPointsData(members: any, index: number, date: DateYMD) {
        var self = this;

        this.qs.teamExternalData(this.userService, date).subscribe((result) => {
            var ret = [];

            Object.keys(result.data).forEach(function(c) {
                var memberUsername = self.acquiredMembersObj[c];

                ret.push({
                    member: memberUsername,
                    points: result.data[c].StoryPoints
                });
            });

            this.acquiredData[index] = ret;

            var br : boolean = true;

            this.acquiredData.forEach(function(ad) {
                if (ad == null)
                    br = false;
            });

            if (br)
                this.buildColumns();
        });
    }

    buildColumns() {
        var self = this;

        this.acquiredUsernames.forEach(au => {
            self.chartColumns.push([au]);
        });

        this.acquiredData.forEach(a => {
            a.forEach(ad => {
                this.chartColumns.forEach((col, idx) => {
                    if (col[0] == ad.member) {
                        this.chartColumns[idx].push(ad.points);
                    }
                });
            });
        });

        this.buildMedian();
    }

    buildMedian() {
        var median : [any] = ['Median'];

        var columnCount = this.chartColumns.length;

        if (columnCount) {
            var len = this.chartColumns[0].length;

            for (var i = 1; i < len; i++) {
                var sum = 0;
                var nullValues = 0;

                for (var j = 0; j < columnCount; j++) {
                    if (this.chartColumns[j][i] == null)
                        nullValues++;
                    else
                        sum += this.chartColumns[j][i];
                }

                var med = sum / (columnCount - nullValues);

                median.push(!isNaN(med) ? med : null);
            }
        }

        this.chartColumns.push(median);

        this.buildChart();
    }

}
