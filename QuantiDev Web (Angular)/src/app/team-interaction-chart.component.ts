import { Component } from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';
import { Http, Headers, URLSearchParams, RequestOptions } from '@angular/http';

import { IMyOptions, IMyDateRangeModel } from 'mydaterangepicker';

import { UserService } from './user.service';
import { QuantiServer, DateYMD } from './quantiserver';

declare var d3;
declare var c3;
declare var moment;

@Component({
    selector: 'team-interaction-chart',
    templateUrl: './team-interaction-chart.component.html',
    styleUrls: ['./team-interaction-chart.component.css']
})

export class TeamInteractionChartComponent {
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

    qs : QuantiServer;

    dataAvailable = true;
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

    cleanData() {
        this.chartDates = [];
        this.chartColumns = [];

        this.acquiredData = [];
        this.acquiredUsernames = [];
    }

    loadData() {
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
        this.router.navigate(['/team/interaction/' + event.beginDate.year + '/' + event.beginDate.month + '/' + event.beginDate.day + '/to/' + event.endDate.year + '/' + event.endDate.month + '/' + event.endDate.day]);

        this.dataLoading = true;

        this.fromYear = event.beginDate.year;
        this.fromMonth = event.beginDate.month;
        this.fromDay = event.beginDate.day;

        this.toYear = event.endDate.year;
        this.toMonth = event.endDate.month;
        this.toDay = event.endDate.day;

        this.cleanData();
        this.loadData();
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
                    },
                    onclick: function(e) {
                        var dmySplit = self.chartDates[e.x].split('-');

                        self.router.navigate(['/team/interaction/' + dmySplit[2] + '/' + dmySplit[1] + '/' + dmySplit[0]]);
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
                        label: 'Interaction Rating',
                        min: 1,
                        max: 5,
                        tick: {
                            format: function(d) {
                                var emojis = ['😟', '🙁', '😶', '😀', '😁'];

                                if (d > 0 && d < 6)
                                    return emojis[d - 1];

                                return '...';
                            },
                            fit: false
                        }
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

                self.getInteractionData(index++, {
                    year: d.getFullYear(),
                    month: d.getMonth() + 1,
                    day: d.getDate()
                });
            });
        });
    }

    getInteractionData(index: number, date: DateYMD) {
        this.qs.getInteractionsSummaryDay(this.userService, date).subscribe((result) => {
            var ret = [];

            this.acquiredUsernames.forEach(au => {
                ret.push(null);
            });

            result.summary.forEach(is => {
                for (var i = 0; i < this.acquiredUsernames.length; i++) {
                    var currentUn = this.acquiredUsernames[i];

                    if (is.member.username == currentUn) {
                        ret[i] = is.median;
                    }
                }
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

        var idx = 0;

        var res = [];

        this.acquiredUsernames.forEach(au => {
            var col = [au];

            this.acquiredData.forEach(ad => {
                col.push(ad[idx]);
            });

            res.push(col);

            idx++;
        });

        this.chartColumns = res;

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
