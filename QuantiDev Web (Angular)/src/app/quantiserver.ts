import { Http, Headers, URLSearchParams, RequestOptions } from '@angular/http';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

import { Coordinates } from './coordinates';
import { UserService } from './user.service';
import { TeamInfo } from './team';

import { environment } from '../environments/environment';

export interface DateYMD {
    year: number;
    month: number;
    day: number;
}

export class QuantiServer {

    private static BaseURL : string = environment.api;

    constructor(private http: Http) {}

    signup(name: string, username: string, password: string, email: string) {
        let headers = new Headers();

        headers.append('Content-Type', 'application/json');

        let params = new URLSearchParams();

        params.set('name', name);
        params.set('username', username);
        params.set('password', password);
        params.set('email', email);

        return this.http
            .post(
                QuantiServer.BaseURL + 'signup',
                params,
                headers
            )
            .map(res => res.json()
        );
    }

    login(username: string, password: string) {
        let headers = new Headers();

        headers.append('Content-Type', 'application/json');

        let params = new URLSearchParams();

        params.set('username', username);
        params.set('password', password);

        return this.http
            .get(
                QuantiServer.BaseURL + 'login',
                { headers: headers, search: params }
            )
            .map(res => res.json()
        );
    }

    createTeam(userService: UserService, name: string) {
        let headers = new Headers();

        headers.append('Authorization', userService.authorizationHeader());

        let params = new URLSearchParams();

        params.set('name', name);

        let options = new RequestOptions({ headers: headers })

        return this.http
            .post(
                QuantiServer.BaseURL + 'team',
                params,
                options
            )
            .map(res => res.json()
        );
    }

    changePassword(userService: UserService, oldPassword: string, newPassword: string) {
        let headers = new Headers();

        headers.append('Authorization', userService.authorizationHeader());

        let params = new URLSearchParams();

        params.set('oldPassword', oldPassword);
        params.set('newPassword', newPassword);

        let options = new RequestOptions({ headers: headers })

        return this.http
            .post(
                QuantiServer.BaseURL + 'user/settings/password',
                params,
                options
            )
            .map(res => res.json()
        );
    }

    changeEmail(userService: UserService, oldEmail: string, newEmail: string) {
        let headers = new Headers();

        headers.append('Authorization', userService.authorizationHeader());

        let params = new URLSearchParams();

        params.set('oldEmail', oldEmail);
        params.set('newEmail', newEmail);

        let options = new RequestOptions({ headers: headers })

        return this.http
            .post(
                QuantiServer.BaseURL + 'user/settings/email',
                params,
                options
            )
            .map(res => res.json()
        );
    }

    deleteAccount(userService: UserService) {
        let headers = new Headers();

        headers.append('Authorization', userService.authorizationHeader());

        let options = new RequestOptions({ headers: headers })

        return this.http
            .delete(
                QuantiServer.BaseURL + 'user',
                options
            )
            .map(res => res.json()
        );
    }

    joinTeam(userService: UserService, team: TeamInfo, key: string) {
        let headers = new Headers();

        headers.append('Authorization', userService.authorizationHeader());

        let params = new URLSearchParams();

        params.set('id', team.id);

        if (key)
            params.set('key', key);

        let options = new RequestOptions({ headers: headers })

        return this.http
            .post(
                QuantiServer.BaseURL + 'team/join',
                params,
                options
            )
            .map(res => res.json()
        );
    }

    currentTeam(userService: UserService) {
        let headers = new Headers();

        headers.append('Authorization', userService.authorizationHeader());

        return this.http
            .get(
                QuantiServer.BaseURL + 'team',
                { headers: headers }
            )
            .map(res => res.json()
        );
    }

    getTeamMetric(userService: UserService, date: DateYMD) {
        let headers = new Headers();

        headers.append('Authorization', userService.authorizationHeader());

        return this.http
            .get(
                QuantiServer.BaseURL + 'team/metric/' + date.year + '/' + date.month + '/' + date.day,
                { headers: headers }
            )
            .map(res => res.json()
        );
    }

    teamSettings(userService: UserService) {
        let headers = new Headers();

        headers.append('Authorization', userService.authorizationHeader());

        return this.http
            .get(
                QuantiServer.BaseURL + 'team/settings',
                { headers: headers }
            )
            .map(res => res.json()
        );
    }

    teamListing(userService : UserService) {
        let headers = new Headers();

        headers.append('Content-Type', 'application/json');
        headers.append('Authorization', userService.authorizationHeader());

        return this.http
            .get(
                QuantiServer.BaseURL + 'team/list',
                { headers: headers }
            )
            .map(res => res.json()
        );
    }

    teamCommunicationData(userService: UserService, date: DateYMD, median: Boolean) {
        let headers = new Headers();

        headers.append('Authorization', userService.authorizationHeader());

        return this.http
            .get(
                QuantiServer.BaseURL + 'team/communication/' + (median ? 'median/' : '') + date.year + '/' + date.month + '/' + date.day,
                { headers: headers }
            )
            .map(res => res.json()
        );
    }

    teamStoryPointsData(userService: UserService, date: DateYMD, median: Boolean) {
        if (!median)
            throw new Error('Not implemented.');

        let headers = new Headers();

        headers.append('Authorization', userService.authorizationHeader());

        return this.http
            .get(
                QuantiServer.BaseURL + 'team/sp/' + (median ? 'median/' : '') + date.year + '/' + date.month + '/' + date.day,
                { headers: headers }
            )
            .map(res => res.json()
        );
    }

    teamExternalData(userService: UserService, date: DateYMD) {
        let headers = new Headers();

        headers.append('Authorization', userService.authorizationHeader());

        return this.http
            .get(
                QuantiServer.BaseURL + 'team/external/' + date.year + '/' + date.month + '/' + date.day,
                { headers: headers }
            )
            .map(res => res.json()
        );
    }

    getExternalServices(userService: UserService) {
        let headers = new Headers();

        headers.append('Authorization', userService.authorizationHeader());

        return this.http
            .get(
                QuantiServer.BaseURL + 'connections',
                { headers: headers }
            )
            .map(res => res.json()
        );
    }

    getConnectedServices(userService: UserService) {
        let headers = new Headers();

        headers.append('Authorization', userService.authorizationHeader());

        return this.http
            .get(
                QuantiServer.BaseURL + 'connection',
                { headers: headers }
            )
            .map(res => res.json()
        );
    }

    getUserLocation(userService: UserService) {
        let headers = new Headers();

        headers.append('Authorization', userService.authorizationHeader());

        return this.http
            .get(
                QuantiServer.BaseURL + 'user/settings/location',
                { headers: headers }
            )
            .map(res => res.json()
        );
    }

    setUserLocation(userService: UserService, location: string) {
        let headers = new Headers();

        headers.append('Authorization', userService.authorizationHeader());

        let params = new URLSearchParams();

        params.set('location', location);

        let options = new RequestOptions({ headers: headers })

        return this.http
            .post(
                QuantiServer.BaseURL + 'user/settings/location',
                params,
                options
            )
            .map(res => res.json()
        );
    }

    setExternalServiceCredential(userService: UserService, service: String, credential: Object) {
        let headers = new Headers();

        headers.append('Authorization', userService.authorizationHeader());

        let params = new URLSearchParams();

        for (let param in credential)
            params.set(param, credential[param]);

        let options = new RequestOptions({ headers: headers })

        return this.http
            .post(
                QuantiServer.BaseURL + 'connection/' + service,
                params,
                options
            )
            .map(res => res.json()
        );
    }

    removeExternalServiceCredential(userService: UserService, service: String) {
        let headers = new Headers();

        headers.append('Content-Type', 'application/json');
        headers.append('Authorization', userService.authorizationHeader());

        return this.http
            .delete(
                QuantiServer.BaseURL + 'connection/' + service,
                { headers: headers }
            )
            .map(res => res.json()
        );
    }

    teamWorkplaceCoordinates(userService: UserService) {
        let headers = new Headers();

        headers.append('Authorization', userService.authorizationHeader());

        return this.http
            .get(
                QuantiServer.BaseURL + 'team/workplace',
                { headers: headers }
            )
            .map(res => res.json()
        );
    }

    changeTeamName(userService: UserService, name: string) {
        /** This one works! */

        let headers = new Headers();

        headers.append('Authorization', userService.authorizationHeader());

        let params = new URLSearchParams();

        params.set('name', name);

        let options = new RequestOptions({ headers: headers })

        return this.http
            .post(
                QuantiServer.BaseURL + 'team/settings',
                params,
                options
            )
            .map(res => res.json()
        );
    }

    changeTeamCoordinates(userService: UserService, coordinates: Coordinates) {
        let headers = new Headers();

        headers.append('Authorization', userService.authorizationHeader());

        let params = new URLSearchParams();

        params.set('latitude', "" + coordinates.latitude);
        params.set('longitude', "" + coordinates.longitude);
        params.set('identifier', "< Unnamed >");    /**  Required by the API, but unused.  */

        let options = new RequestOptions({ headers: headers })

        return this.http
            .post(
                QuantiServer.BaseURL + 'team/workplace',
                params,
                options
            )
            .map(res => res.json()
        );
    }

    regenerateTeamInviteCode(userService: UserService) {
        let headers = new Headers();

        headers.append('Authorization', userService.authorizationHeader());

        let options = new RequestOptions({ headers: headers })

        return this.http
            .post(
                QuantiServer.BaseURL + 'team/key',
                {},
                options
            )
            .map(res => res.json()
        );
    }

    changeTeamOpenToEveryone(userService: UserService, open: boolean) {
        let headers = new Headers();

        headers.append('Authorization', userService.authorizationHeader());

        let params = new URLSearchParams();

        params.set('open', "" + (open ? 1 : 0));

        let options = new RequestOptions({ headers: headers })

        return this.http
            .post(
                QuantiServer.BaseURL + 'team/settings',
                params,
                options
            )
            .map(res => res.json()
        );
    }

    removeTeamMember(userService: UserService, username: string) {
        let headers = new Headers();

        headers.append('Authorization', userService.authorizationHeader());

        let params = new URLSearchParams();

        params.set('username', username);

        let options = new RequestOptions({ headers: headers })

        return this.http
            .post(
                QuantiServer.BaseURL + 'team/kick',
                params,
                options
            )
            .map(res => res.json()
        );
    }

    changeTeamLeader(userService: UserService, leader: string) {
        let headers = new Headers();

        headers.append('Authorization', userService.authorizationHeader());

        let params = new URLSearchParams();

        params.set('username', leader);

        let options = new RequestOptions({ headers: headers })

        return this.http
            .post(
                QuantiServer.BaseURL + 'team/leader',
                params,
                options
            )
            .map(res => res.json()
        );
    }

    getSprintData(userService: UserService) {
        let headers = new Headers();

        headers.append('Authorization', userService.authorizationHeader());

        return this.http
            .get(
                QuantiServer.BaseURL + 'team/sprint',
                { headers: headers }
            )
            .map(res => res.json()
        );
    }

    setupSprint(userService: UserService, length: number, startDate: DateYMD) {
        let headers = new Headers();

        headers.append('Authorization', userService.authorizationHeader());

        let params = new URLSearchParams();

        params.set('length', '' + length);

        params.set('day', '' + startDate.day);
        params.set('month', '' + startDate.month);
        params.set('year', '' + startDate.year);

        let options = new RequestOptions({ headers: headers })

        return this.http
            .post(
                QuantiServer.BaseURL + 'team/sprint',
                params,
                options
            )
            .map(res => res.json()
        );
    }

    destroyTeam(userService: UserService) {
        let headers = new Headers();

        headers.append('Authorization', userService.authorizationHeader());

        return this.http
            .delete(
                QuantiServer.BaseURL + 'team',
                { headers: headers }
            )
            .map(res => res.json()
        );
    }

    leaveTeam(userService: UserService) {
        let headers = new Headers();

        headers.append('Authorization', userService.authorizationHeader());

        let options = new RequestOptions({ headers: headers })

        return this.http
            .post(
                QuantiServer.BaseURL + 'team/leave',
                {},
                options
            )
            .map(res => res.json()
        );
    }

    getCurrentSprintData(userService: UserService) {
        let headers = new Headers();

        headers.append('Authorization', userService.authorizationHeader());

        return this.http
            .get(
                QuantiServer.BaseURL + 'team/sprint/current',
                { headers: headers }
            )
            .map(res => res.json()
        );
    }

    getPastSprintData(userService: UserService, identifier: string) {
        let headers = new Headers();

        headers.append('Authorization', userService.authorizationHeader());

        return this.http
            .get(
                QuantiServer.BaseURL + 'team/sprint/' + identifier,
                { headers: headers }
            )
            .map(res => res.json()
        );
    }

    getPastSprintsSelf(userService: UserService) {
        let headers = new Headers();

        headers.append('Authorization', userService.authorizationHeader());

        return this.http
            .get(
                QuantiServer.BaseURL + 'team/sprints/user',
                { headers: headers }
            )
            .map(res => res.json()
        );
    }

    getPastSprintSelf(userService: UserService, identifier: string) {
        let headers = new Headers();

        headers.append('Authorization', userService.authorizationHeader());

        return this.http
            .get(
                QuantiServer.BaseURL + 'team/sprint/' + identifier + '/user',
                { headers: headers }
            )
            .map(res => res.json()
        );
    }

    submitCohesionReport(userService: UserService, sprint: string, answers: Object) {
        let headers = new Headers();

        headers.append('Authorization', userService.authorizationHeader());

        let params = new URLSearchParams();

        params.set('sprint', sprint);

        for (let param in answers)
            params.set(param, answers[param]);

        let options = new RequestOptions({ headers: headers })

        return this.http
            .post(
                QuantiServer.BaseURL + 'team/sprint/' + sprint + '/cohesion',
                params,
                options
            )
            .map(res => res.json()
        );
    }

    getSprintCohesionSummary(userService: UserService, sprint: string) {
        let headers = new Headers();

        headers.append('Authorization', userService.authorizationHeader());

        return this.http
            .get(
                QuantiServer.BaseURL + 'team/sprint/' + sprint + '/cohesion/summary',
                { headers: headers }
            )
            .map(res => res.json()
        );
    }

    getSprintCohesionSummaryRange(userService: UserService, start: DateYMD, end: DateYMD) {
        let headers = new Headers();

        headers.append('Authorization', userService.authorizationHeader());

        return this.http
            .get(
                QuantiServer.BaseURL + 'team/sprints/' + start.year + '/' + start.month + '/' + start.day + '/to/' + end.year + '/' + end.month + '/' + end.day,
                { headers: headers }
            )
            .map(res => res.json()
        );
    }

    getUserByUsername(userService: UserService, username: string) {
        let headers = new Headers();

        headers.append('Authorization', userService.authorizationHeader());

        return this.http
            .get(
                QuantiServer.BaseURL + 'user/by/username/' + username,
                { headers: headers }
            )
            .map(res => res.json()
        );
    }

    getUserById(userService: UserService, id: string) {
        let headers = new Headers();

        headers.append('Authorization', userService.authorizationHeader());

        return this.http
            .get(
                QuantiServer.BaseURL + 'user/by/id/' + id,
                { headers: headers }
            )
            .map(res => res.json()
        );
    }

    getInteractionsDetailDay(userService: UserService, date: DateYMD) {
        let headers = new Headers();

        headers.append('Authorization', userService.authorizationHeader());

        return this.http
            .get(
                QuantiServer.BaseURL + 'team/interactions/detail/' + date.year + '/' + date.month + '/' + date.day,
                { headers: headers }
            )
            .map(res => res.json()
        );
    }

    getInteractionsSummaryDay(userService: UserService, date: DateYMD) {
        let headers = new Headers();

        headers.append('Authorization', userService.authorizationHeader());

        return this.http
            .get(
                QuantiServer.BaseURL + 'team/interactions/summary/' + date.year + '/' + date.month + '/' + date.day,
                { headers: headers }
            )
            .map(res => res.json()
        );
    }

    getTeamDetail(userService: UserService, date: DateYMD) {
        let headers = new Headers();

        headers.append('Authorization', userService.authorizationHeader());

        return this.http
            .get(
                QuantiServer.BaseURL + 'team/detail/' + date.year + '/' + date.month + '/' + date.day,
                { headers: headers }
            )
            .map(res => res.json()
        );
    }

}
