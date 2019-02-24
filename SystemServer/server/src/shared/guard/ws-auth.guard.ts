import { Injectable, ExecutionContext, CanActivate } from '@nestjs/common';
import { AuthService } from '@commander/core/auth/auth.service';
import { defer, empty, of } from 'rxjs';
import { catchError, map, flatMap, tap, defaultIfEmpty } from 'rxjs/operators';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { UserService } from '@commander/core/user/user.service';
import { InstanceType } from 'typegoose';
import { User } from '@commander/core/user/user.model';

@Injectable()
export class WsAuthGuard implements CanActivate {
    constructor(
        private authService: AuthService,
        private readonly userService: UserService,
    ) {}

    canActivate(context: ExecutionContext) {
        const {
            request: { user },
        } = context.switchToWs().getClient();

        const authenticationToken = context.switchToWs().getData()
            .authenticationToken;

        const onUser = defer(() => this.userService.getById(user.id));

        const onToken = defer(() =>
            of(this.authService.verifyToken(authenticationToken)),
        ).pipe(
            catchError(e => {
                throw new WsException(e);
            }),
            map(() => this.authService.decodeToken(authenticationToken)),
            flatMap(jwtPayload => this.authService.validateUser(jwtPayload)),
        );

        const client: Socket = context.switchToWs().getClient();
        const bindUser = () =>
            tap((_user: InstanceType<User>) => (client.request.user = _user));

        const validate = authenticationToken
            ? onToken
            : user
            ? onUser
            : empty();

        return validate.pipe(
            bindUser(),
            map(Boolean),
            defaultIfEmpty(true),
        );
    }
}
