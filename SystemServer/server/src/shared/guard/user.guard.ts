import { UserService } from '@commander/core/user/user.service';
import {
    CanActivate,
    ExecutionContext,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { from } from 'rxjs';
import { tap, map } from 'rxjs/operators';

@Injectable()
export class UserGuard implements CanActivate {
    constructor(private readonly userSerice: UserService) {}

    canActivate(context: ExecutionContext) {
        const {
            params: { username },
        } = context.switchToHttp().getRequest();

        return from(this.userSerice.getByUsername(username)).pipe(
            map(item => Boolean(item)),
            tap(item => {
                if (!item) {
                    throw new NotFoundException('User does not exist');
                }
            }),
        );
    }
}
