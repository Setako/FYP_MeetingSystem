import {
    Controller,
    Get,
    UseGuards,
    Query,
    BadRequestException,
    Res,
    HttpCode,
    HttpStatus,
    Delete,
} from '@nestjs/common';
import { GoogleAuthService } from './google-auth.service';
import { AuthGuard } from '@nestjs/passport';
import { Auth } from '@commander/shared/decorator/auth.decorator';
import { User } from '../user/user.model';
import { InstanceType } from 'typegoose';
import { ObjectUtils } from '@commander/shared/utils/object.utils';
import { GoogleAuthUrlDto } from './dto/google-auth-url.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { of, from, defer, zip, empty } from 'rxjs';
import {
    catchError,
    map,
    tap,
    flatMap,
    defaultIfEmpty,
    shareReplay,
    toArray,
} from 'rxjs/operators';
import { UserService } from '../user/user.service';
import { GetAccessTokenDto } from './dto/get-access-token.dto';
import { Response } from 'express';
import { GetAuthUrlQueryDto } from './dto/get-auth-url-query.dto';
import { skipFalsy } from '@commander/shared/operator/function';
import { GoogleCalendarService } from './google-calendar.service';

@Controller('google')
export class GoogleController {
    constructor(
        private readonly googleCalendarService: GoogleCalendarService,
        private readonly authService: GoogleAuthService,
        private readonly userService: UserService,
    ) {}

    @Get('auth/url')
    @UseGuards(AuthGuard('jwt'))
    getAuthUrl(
        @Auth() user: InstanceType<User>,
        @Query() query: GetAuthUrlQueryDto,
    ) {
        const isTokenAvailable$ = of(user.googleRefreshToken).pipe(
            skipFalsy(),
            flatMap(token => this.authService.isRefreshTokenAvailable(token)),
            tap(available => {
                if (available) {
                    throw new BadRequestException(
                        'User has enabled Google services',
                    );
                }
            }),
        );

        const clearUserToken$ = isTokenAvailable$.pipe(
            defaultIfEmpty(null),
            flatMap(() => this.userService.editGoogleRefreshToken(user.id)),
        );

        const authUrl$ = clearUserToken$.pipe(
            map(() =>
                this.authService.getAuthUrl(
                    user.id,
                    query.successRedirect
                        ? decodeURIComponent(query.successRedirect)
                        : query.successRedirect,
                ),
            ),
        );

        return authUrl$.pipe(
            map(url => ObjectUtils.ObjectToPlain({ url }, GoogleAuthUrlDto)),
        );
    }

    @Get('auth/receive')
    async handleRedireToken(
        @Query() authDto: GoogleAuthDto,
        @Res() res: Response,
    ) {
        const verify$ = of(authDto.state).pipe(
            map(item => this.authService.verifyAuthState(item)),
            catchError(e => {
                const message = e.message
                    .replace('token', 'state')
                    .replace('jwt', 'state');
                throw new BadRequestException(message);
            }),
        );

        const state$ = defer(() =>
            of(this.authService.decodeAuthState(authDto.state)),
        ).pipe(shareReplay());
        const userId$ = state$.pipe(map(item => item.userId));
        const successRedirect$ = state$.pipe(
            flatMap(({ successRedirect }) =>
                successRedirect ? of(successRedirect) : empty(),
            ),
        );

        const refreshToken$ = defer(() =>
            this.authService.getRefreshToken(authDto.code),
        );

        const flow$ = verify$.pipe(
            flatMap(() => zip(userId$, refreshToken$)),
            flatMap(([id, { tokens: { refresh_token } }]) =>
                this.userService.editGoogleRefreshToken(id, refresh_token),
            ),
            flatMap(() => successRedirect$),
            tap(url => (url ? res.redirect(url) : res.end())),
        );

        await flow$.toPromise();
        res.end();
    }

    @Get('auth/access-token')
    @UseGuards(AuthGuard('jwt'))
    async getAccessToken(@Auth() user: InstanceType<User>) {
        if (!user.googleRefreshToken) {
            throw new BadRequestException(
                'Please enable Google services first',
            );
        }

        const accessToken$ = from(
            this.authService.getAccessToken(user.googleRefreshToken),
        ).pipe(
            catchError(async () => {
                await this.userService.editGoogleRefreshToken(user.id);
                throw new BadRequestException(
                    'The authorization grant provided is invalid. Please try re-enabling Google services.',
                );
            }),
        );

        return accessToken$.pipe(
            map(token =>
                ObjectUtils.ObjectToPlain({ token }, GetAccessTokenDto),
            ),
        );
    }

    @Delete('auth/refresh-token')
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(AuthGuard('jwt'))
    async getRefreshToken(@Auth() user: InstanceType<User>) {
        await this.userService.editGoogleRefreshToken(user.id);
        user.setting.calendarImportance = [];
        user.setting.markEventOnCalendarId = null;
    }

    @Get('calendar')
    @UseGuards(AuthGuard('jwt'))
    getCalendarList(@Auth() user: InstanceType<User>) {
        if (!user.googleRefreshToken) {
            throw new BadRequestException(
                'Please enable Google services first',
            );
        }

        return this.googleCalendarService
            .getAllCalendars(user.googleRefreshToken)
            .pipe(
                map(({ id, summary }) => ({ id, summary })),
                toArray(),
                map(items => ({ items, length: items.length })),
            );
    }
}
