import { Injectable, ExecutionContext, CanActivate } from '@nestjs/common';
import { AuthService } from '@commander/core/auth/auth.service';
import { defer } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsAuthGuard implements CanActivate {
    constructor(private authService: AuthService) {}

    async canActivate(context: ExecutionContext) {
        const authenticationToken = context.switchToWs().getData()
            .authenticationToken;

        defer(() => this.authService.verifyToken(authenticationToken)).pipe(
            catchError(e => {
                throw new WsException(e);
            }),
        );

        const jwtPayload = this.authService.decodeToken(authenticationToken);
        const user = await this.authService
            .validateUser(jwtPayload)
            .toPromise();

        const client: Socket = context.switchToWs().getClient();
        client.request.user = user;

        return Boolean(user);
    }
}
