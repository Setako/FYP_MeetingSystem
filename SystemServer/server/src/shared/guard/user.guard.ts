import { UserService } from '@commander/core/user/user.service';
import {
    CanActivate,
    ExecutionContext,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

@Injectable()
export class UserGuard implements CanActivate {
    constructor(private readonly userSerice: UserService) {}

    async canActivate(context: ExecutionContext) {
        const request = context.switchToHttp().getRequest();
        const username = await this.userSerice.getByUsername(
            request.params.username,
        );

        if (!username) {
            throw new NotFoundException('User does not exist');
        }

        return true;
    }
}
