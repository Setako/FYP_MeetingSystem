import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import { defer } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class GoogleEventService {
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

    getAllBusyEvent({
        refreshToken,
        timeMin,
        timeMax,
        calendarIds,
    }: {
        refreshToken: string;
        timeMax: Date;
        timeMin: Date;
        calendarIds: string[];
    }) {
        const calendar = this.getCalendar(refreshToken);
        const freebusy = calendar.freebusy.query;
        const requestBody = {
            timeMin: timeMin.toISOString(),
            timeMax: timeMax.toISOString(),
            items: calendarIds.map(id => ({ id })),
        };

        return defer(() => freebusy({ requestBody })).pipe(
            map(item => item.data.calendars),
        );
    }
}
