import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import { of, defer } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable()
export class GoogleDriveService {
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

    private getDrive(refreshToken: string) {
        const client = this.getClient();
        client.setCredentials({ refresh_token: refreshToken });
        return google.drive({
            version: 'v3',
            auth: client,
        });
    }

    public setAnyoneWithLinkPermission(refreshToken: string, fileId: string) {
        const drive = this.getDrive(refreshToken);

        return defer(() =>
            drive.permissions.create({
                fileId,
                requestBody: {
                    type: 'anyone',
                    role: 'reader',
                },
            }),
        ).pipe(
            map(_ => true),
            catchError(_ => of(false)),
        );
    }
}
