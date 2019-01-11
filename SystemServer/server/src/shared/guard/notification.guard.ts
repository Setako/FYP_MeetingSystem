import { NotificationService } from '@commander/core/notification/notification.service';
import {
    CanActivate,
    ExecutionContext,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { from, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

@Injectable()
export class NotificationGuard implements CanActivate {
    constructor(private readonly notificationService: NotificationService) {}

    canActivate(context: ExecutionContext) {
        const {
            user,
            params: { id },
        } = context.switchToHttp().getRequest();

        return from(this.notificationService.getById(id)).pipe(
            map(item => (item.receiver as Types.ObjectId).equals(user._id)),
            catchError(() => of(false)),
            tap(notification => {
                if (!notification) {
                    throw new NotFoundException('Notification does not exist');
                }
            }),
        );
    }
}
