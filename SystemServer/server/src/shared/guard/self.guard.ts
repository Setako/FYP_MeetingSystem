import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class SelfGuard implements CanActivate {
    canActivate(context: ExecutionContext) {
        const {
            user,
            params: { username },
        } = context.switchToHttp().getRequest();

        return user.username === username;
    }
}
