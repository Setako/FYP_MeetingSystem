import { UserService } from '@commander/core/user/user.service';
import {
    CanActivate,
    ExecutionContext,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

@Injectable()
export class SelfGuard implements CanActivate {
    constructor(private readonly userSerice: UserService) {}

    async canActivate(context: ExecutionContext) {
        const request = context.switchToHttp().getRequest();
        const username = request.params.username;

        return request.user.username === username;
    }
}
