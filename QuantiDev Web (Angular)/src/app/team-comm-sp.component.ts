import { Component, ViewChild } from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';
import { Http, Headers, URLSearchParams, RequestOptions } from '@angular/http';

import { ModalDirective } from 'ng2-bootstrap/modal';

import { UserService } from './user.service';
import { QuantiServer, DateYMD } from './quantiserver';

import { Statistics, StatisticsResult } from './statistics';

import { IMyOptions, IMyDateRangeModel } from 'mydaterangepicker';

declare var d3;
declare var c3;
declare var moment;

@Component({
    selector: 'team-comm-sp',
    templateUrl: './team-comm-sp.component.html',
    styleUrls: ['./team-comm-sp.component.css']
})

export class TeamCommSPComponent {
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
    acquiredDataSP = [];

    bcOnce = false;

    qs : QuantiServer;

    dataAvailable = true;
    dataLoading = true;

    pearson : StatisticsResult;

    @ViewChild('analysisModal') public analysisModal : ModalDirective;

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
        this.acquiredDataSP = [];

        this.bcOnce = false;
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

    onDateRangeChanged(event: IMyDateRangeModel) {
        this.router.navigate(['/team/csp/' + event.beginDate.year + '/' + event.beginDate.month + '/' + event.beginDate.day + '/to/' + event.endDate.year + '/' + event.endDate.month + '/' + event.endDate.day]);

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
        var col1 = this.chartColumns[0];
        var col2 = this.chartColumns[1];

        for (var i = 1; i < col1.length; i++)
            if (col1[i] && col2[i])
                return true;

        return false;
    }

    simplifySet() {
        if (!this.hasData())
            return null;

        var arr1 = [];
        var arr2 = [];

        var col1 = this.chartColumns[0];
        var col2 = this.chartColumns[1];

        for (var i = 1; i < col1.length; i++)
            if (col1[i] && col2[i]) {
                arr1.push(col1[i]);
                arr2.push(col2[i]);
            }

        return [ arr1, arr2 ];
    }

    buildChart() {
        var self = this;

        this.dataLoading = false;
        this.dataAvailable = this.hasData();

        var simplifiedSet = this.simplifySet();

        if (simplifiedSet != null) {
            this.chartColumns = [
                ['Communication'].concat(simplifiedSet[0]),
                ['Story Points'].concat(simplifiedSet[1])
            ];

            this.pearson = Statistics.pearsonAnalyze(
                Statistics.pearsonCorrelation(simplifiedSet[0], simplifiedSet[1])
            );

            if (isNaN(this.pearson.result))
                this.pearson = null;
        } else {
            this.pearson = null;
            this.dataAvailable = false;
        }

        setTimeout(function() {
            self.chart = c3.generate({
                bindto: '#chart',
                data: {
                    xs: {
                        'Story Points': 'Communication'
                    },
                    columns: self.chartColumns,
                    axes: {
                        'Communication': 'x',
                        'Story Points': 'y'
                    },
                    type: 'scatter'
                },
                axis: {
                    y: {
                        label: 'Story Points'
                    },
                    x: {
                        label: 'Communication Rating',
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
            self.acquiredDataSP.push(null);

            var date = {
                year: d.getFullYear(),
                month: d.getMonth() + 1,
                day: d.getDate()
            };

            self.getCommunicationData(index, date);
            self.getStoryPointsData(index, date);

            index++;
        });
    }

    getCommunicationData(index: number, date: DateYMD) {
        this.qs.teamCommunicationData(this.userService, date, true).subscribe((result) => {
            this.acquiredData[index] = result.median;

            var br : boolean = true;

            this.acquiredData.forEach(function(ad) {
                if (ad == null)
                    br = false;
            });

            if (br) {
                if (!this.bcOnce)
                    this.bcOnce = true;
                else
                    this.buildColumns();
            }
        });
    }

    getStoryPointsData(index: number, date: DateYMD) {
        this.qs.teamStoryPointsData(this.userService, date, true).subscribe((result) => {
            this.acquiredDataSP[index] = result.median;

            var br : boolean = true;

            this.acquiredDataSP.forEach(function(ad) {
                if (ad == null)
                    br = false;
            });

            if (br) {
                if (!this.bcOnce)
                    this.bcOnce = true;
                else
                    this.buildColumns();
            }
        });
    }

    buildColumns() {
        var com : [any] = ['Communication'];

        this.acquiredData.forEach(a => {
            com.push(!isNaN(a) && a != 0 ? Math.ceil(parseInt(a)) : null);
        });

        this.chartColumns.push(com);

        var sp : [any] = ['Story Points'];

        this.acquiredDataSP.forEach(a => {
            sp.push(!isNaN(a) && a != 0 ? Math.ceil(parseInt(a)) : null);
        });

        this.chartColumns.push(sp);

        this.buildChart();
    }

    openAnalysisModal() {
        this.analysisModal.show();
    }
}
