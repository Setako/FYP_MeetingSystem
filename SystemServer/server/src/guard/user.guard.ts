import {
    Injectable,
    CanActivate,
    ExecutionContext,
    NotFoundException,
} from '@nestjs/common';
import { UserService } from '../core/user/user.service';

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
