// TODO: This was NOT tested!

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
    selector: 'team-cohesion-sp',
    templateUrl: './team-cohesion-sp.component.html',
    styleUrls: ['./team-cohesion-sp.component.css']
})

export class TeamCohesionSPComponent {
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

        this.getCohesion();
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

        this.getCohesion();
    }

    onDateRangeChanged(event: IMyDateRangeModel) {
        this.router.navigate(['/team/cohesionsp/' + event.beginDate.year + '/' + event.beginDate.month + '/' + event.beginDate.day + '/to/' + event.endDate.year + '/' + event.endDate.month + '/' + event.endDate.day]);

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
            if (col1[i] !== null && col2[i] !== null)
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
            if (col1[i] !== null && col2[i] !== null) {
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
                ['Cohesion Score'].concat(simplifiedSet[0]),
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
                        'Story Points': 'Cohesion Score'
                    },
                    columns: self.chartColumns,
                    axes: {
                        'Cohesion Score': 'x',
                        'Story Points': 'y'
                    },
                    type: 'scatter'
                },
                axis: {
                    y: {
                        label: 'Story Points'
                    },
                    x: {
                        label: 'Cohesion Score',
                    }
                }
            });
        }, 50);
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

    getCohesion() {
        console.log('here');

        this.qs.getSprintCohesionSummaryRange(this.userService, this.fromDate(), this.toDate()).subscribe((result) => {
            var self = this;

            console.log('not here?');

            if (!result.success || result.sprints.length == 0) {
                this.dataAvailable = false;
                this.dataLoading = false;

                return;
            }

            this.dataAvailable = true;

            this.acquiredData = [];
            this.acquiredDataSP = [];

            result.sprints.forEach(s => {
                this.acquiredData.push(s.cohesion.total);
                this.acquiredDataSP.push(null);
            });

            console.log(result.sprints);

            var idx = 0

            result.sprints.forEach(s => {
                this.getSprintPoints(idx++, s.date.start, s.date.end);
            });
        });
    }

    getSprintPoints(index: number, from: DateYMD, to: DateYMD) {
        var self = this;

        var count = 0;

        var doing = 0;

        var beg : any = new Date(from.year, from.month - 1, from.day, 0, 0, 0, 0);
        var end = new Date(to.year, to.month - 1, to.day, 0, 0, 0, 0);

        while (beg < end) {
            doing++;

            var dymd : DateYMD = {
                year: beg.getFullYear(),
                month: beg.getMonth() + 1,
                day: beg.getDate()
            };

            this.qs.teamExternalData(this.userService, dymd).subscribe((result) => {
                Object.keys(result.data).forEach(function(c) {
                    count += result.data[c].StoryPoints;
                });

                if (!--doing) {
                    this.acquiredDataSP[index] = count;

                    var hasNull = false;

                    this.acquiredDataSP.forEach(adsp => {
                        if (adsp === null)
                            hasNull = true;
                    });

                    if (!hasNull) {
                        this.buildColumns();
                    }
                }
            });

            beg = moment(beg).add(1, 'day').toDate();
        }
    }

    buildColumns() {
        var com : [any] = ['Cohesion Score'];

        this.acquiredData.forEach(a => {
            com.push(!isNaN(a) ? Math.ceil(parseInt(a)) : null);
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
