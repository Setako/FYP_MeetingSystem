import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import { JwtService } from '@nestjs/jwt';
import { of } from 'rxjs';
import { flatMap, map, tap, catchError } from 'rxjs/operators';

interface GoogleAuthState {
    userId: string;
    successRedirect?: string;
}

@Injectable()
export class GoogleAuthService {
    private readonly CLIENT_SECRET: string;
    private readonly CLIENT_ID: string;
    private readonly SCOPES: string[];
    private readonly REDIRECT_URI: string;

    constructor(private readonly jwtService: JwtService) {
        this.CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
        this.CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
        this.SCOPES = [
            'https://www.googleapis.com/auth/drive',
            'https://www.googleapis.com/auth/calendar',
        ];
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

    signAuthState(state: GoogleAuthState) {
        return this.jwtService.sign(state);
    }

    verifyAuthState(state: string) {
        return this.jwtService.verify(state);
    }

    decodeAuthState(state: string): GoogleAuthState {
        const decode = this.jwtService.decode(state) as any;
        return {
            userId: decode.userId,
            successRedirect: decode.successRedirect,
        };
    }

    getAuthUrl(userId: string, successRedirect?: string) {
        const client = this.getClient();

        return client.generateAuthUrl({
            access_type: 'offline',
            scope: this.SCOPES,
            state: this.signAuthState({ userId, successRedirect }),
            prompt: 'consent',
        });
    }

    async getRefreshToken(code: string) {
        return of(this.getClient())
            .pipe(flatMap(client => client.getToken(code)))
            .toPromise();
    }

    async getAccessToken(refreshToken: string) {
        return of(this.getClient())
            .pipe(
                tap(client =>
                    client.setCredentials({
                        refresh_token: refreshToken,
                    }),
                ),
                flatMap(client => client.getAccessToken()),
                map(response => response.token),
            )
            .toPromise();
    }

    async isRefreshTokenAvailable(refreshToken: string) {
        return of(this.getClient())
            .pipe(
                tap(client =>
                    client.setCredentials({
                        refresh_token: refreshToken,
                    }),
                ),
                flatMap(client => client.getRequestHeaders()),
                catchError(e => of(false)),
                map(item => Boolean(item)),
            )
            .toPromise();
    }
}
