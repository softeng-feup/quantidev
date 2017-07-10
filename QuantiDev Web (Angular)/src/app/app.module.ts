import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { RouterModule, Routes } from '@angular/router';

import { AlertModule, ModalModule } from 'ng2-bootstrap';
import { Ng2GoogleChartsModule } from 'ng2-google-charts';
import { MyDatePickerModule } from 'mydatepicker';
import { MyDateRangePickerModule } from 'mydaterangepicker';

import { AppComponent } from './app.component';
import { AboutComponent } from './about.component';
import { HomeComponent } from './home.component';
import { LoginComponent } from './login.component';
import { MobileSignOnComponent } from './mobile-signon.component';
import { SignupComponent } from './signup.component';
import { ConnectionsComponent } from './connections.component';
import { ConnectionsGitHubComponent } from './connections.github.component';
import { TeamCohesionChartComponent } from './team-cohesion-chart.component';
import { TeamCohesionSprintComponent } from './team-cohesion-sprint.component';
import { TeamCohesionSubmitComponent } from './team-cohesion-submit.component';
import { TeamCommitsComponent } from './team-commits.component';
import { TeamCommunicationComponent } from './team-communication.component';
import { TeamCommSPComponent } from './team-comm-sp.component';
import { TeamCohesionSPComponent } from './team-cohesion-sp.component';
import { TeamDetailDayComponent } from './team-detail-day.component';
import { TeamInteractionChartComponent } from './team-interaction-chart.component';
import { TeamInteractionDetailComponent } from './team-interaction-detail.component';
import { TeamManageComponent } from './team-manage.component';
import { TeamLandingComponent } from './team-landing.component';
import { TeamLoCComponent } from './team-loc.component';
import { TeamStoryPointsComponent } from './team-story-points.component';
import { TeamTogetherSPComponent } from './team-together-sp.component';
import { SettingsComponent } from './settings.component';

import { NotFoundComponent } from './not-found.component';

import { UserService } from './user.service';

import { LoggedInGuard } from './logged-in.guard';
import { TeamLeaderGuard } from './team-leader.guard';

const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'about', component: AboutComponent },
    { path: 'login',  component: LoginComponent },
    { path: 'mobile/login', component: MobileSignOnComponent },
    { path: 'signup', component: SignupComponent },
    { path: 'connections', component: ConnectionsComponent, canActivate: [LoggedInGuard] },
    { path: 'connections/callback/github', component: ConnectionsGitHubComponent, canActivate: [LoggedInGuard] },
    { path: 'team', component: TeamLandingComponent, canActivate: [LoggedInGuard] },
    { path: 'team/cohesion/:sprint', component: TeamCohesionSprintComponent, canActivate: [LoggedInGuard] },
    { path: 'team/cohesion/:sprint/submit', component: TeamCohesionSubmitComponent, canActivate: [LoggedInGuard] },
    { path: 'team/manage', component: TeamManageComponent, canActivate: [LoggedInGuard] },
    { path: 'team/detail/:year/:month/:day', component: TeamDetailDayComponent, canActivate: [LoggedInGuard, TeamLeaderGuard] },
    { path: 'team/cohesion/:fromYear/:fromMonth/:fromDay/to/:toYear/:toMonth/:toDay', component: TeamCohesionChartComponent, canActivate: [LoggedInGuard, TeamLeaderGuard] },
    { path: 'team/communication/:fromYear/:fromMonth/:fromDay/to/:toYear/:toMonth/:toDay', component: TeamCommunicationComponent, canActivate: [LoggedInGuard, TeamLeaderGuard] },
    { path: 'team/commits/:fromYear/:fromMonth/:fromDay/to/:toYear/:toMonth/:toDay', component: TeamCommitsComponent, canActivate: [LoggedInGuard, TeamLeaderGuard] },
    { path: 'team/interaction/:year/:month/:day', component: TeamInteractionDetailComponent, canActivate: [LoggedInGuard, TeamLeaderGuard] },
    { path: 'team/interaction/:fromYear/:fromMonth/:fromDay/to/:toYear/:toMonth/:toDay', component: TeamInteractionChartComponent, canActivate: [LoggedInGuard, TeamLeaderGuard] },
    { path: 'team/sp/:fromYear/:fromMonth/:fromDay/to/:toYear/:toMonth/:toDay', component: TeamStoryPointsComponent, canActivate: [LoggedInGuard, TeamLeaderGuard] },
    { path: 'team/csp/:fromYear/:fromMonth/:fromDay/to/:toYear/:toMonth/:toDay', component: TeamCommSPComponent, canActivate: [LoggedInGuard, TeamLeaderGuard] },
    { path: 'team/tsp/:fromYear/:fromMonth/:fromDay/to/:toYear/:toMonth/:toDay', component: TeamTogetherSPComponent, canActivate: [LoggedInGuard, TeamLeaderGuard] },
    { path: 'team/cohesionsp/:fromYear/:fromMonth/:fromDay/to/:toYear/:toMonth/:toDay', component: TeamCohesionSPComponent, canActivate: [LoggedInGuard, TeamLeaderGuard] },
    { path: 'team/loc/:fromYear/:fromMonth/:fromDay/to/:toYear/:toMonth/:toDay', component: TeamLoCComponent, canActivate: [LoggedInGuard, TeamLeaderGuard] },
    { path: 'settings', component: SettingsComponent, canActivate: [LoggedInGuard] },
    { path: '**', component: NotFoundComponent }
];

@NgModule({
    declarations: [
        AppComponent,
        AboutComponent,
        HomeComponent,
        LoginComponent,
        MobileSignOnComponent,
        NotFoundComponent,
        SignupComponent,
        ConnectionsComponent,
        ConnectionsGitHubComponent,
        TeamCohesionChartComponent,
        TeamCohesionSprintComponent,
        TeamCohesionSubmitComponent,
        TeamCommitsComponent,
        TeamCommunicationComponent,
        TeamCohesionSPComponent,
        TeamCommSPComponent,
        TeamDetailDayComponent,
        TeamInteractionChartComponent,
        TeamInteractionDetailComponent,
        TeamLoCComponent,
        TeamManageComponent,
        TeamLandingComponent,
        TeamStoryPointsComponent,
        TeamTogetherSPComponent,
        SettingsComponent
    ],
    imports: [
        BrowserModule,
        FormsModule,
        ReactiveFormsModule,
        HttpModule,
        RouterModule.forRoot(routes),
        Ng2GoogleChartsModule,
        ModalModule.forRoot(),
        MyDatePickerModule,
        MyDateRangePickerModule
    ],
    providers: [
        UserService,
        LoggedInGuard,
        TeamLeaderGuard
    ],
    bootstrap: [
        AppComponent
    ]
})

export class AppModule {}
