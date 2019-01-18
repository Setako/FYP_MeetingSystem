import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import { defer, empty } from 'rxjs';
import { expand, flatMap } from 'rxjs/operators';

@Injectable()
export class GoogleCalendarService {
    private readonly CLIENT_SECRET: string;
    private readonly CLIENT_ID: string;
    private readonly REDIRECT_URI: string;

    constructor() {
        this.CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
        this.CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
        this.REDIRECT_URI = process.env.GOOGLE_REDIRE_URI;

        if (![this.CLIENT_ID, this.CLIENT_SECRET].every(Boolean)) {
            throw new Error(
                'Google service is not available since the client secret or id are missing',
            );
        }
    }

    private getClient() {
        return new google.auth.OAuth2({
            clientId: this.CLIENT_ID,
            clientSecret: this.CLIENT_SECRET,
            redirectUri: this.REDIRECT_URI,
        });
    }

    private getCalendar(refreshToken: string) {
        const client = this.getClient();
        client.setCredentials({ refresh_token: refreshToken });
        return google.calendar({
            version: 'v3',
            auth: client,
        });
    }

    getAllCalendars(refreshToken: string) {
        const calendar = this.getCalendar(refreshToken);
        const list = calendar.calendarList.list;
        return defer(() => list()).pipe(
            expand(result =>
                result.data.nextPageToken
                    ? list({ pageToken: result.data.nextPageToken })
                    : empty(),
            ),
            flatMap(item => item.data.items),
        );
    }
}
