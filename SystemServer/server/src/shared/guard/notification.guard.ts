import { NotificationService } from '@commander/core/notification/notification.service';
import {
    CanActivate,
    ExecutionContext,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { of, empty } from 'rxjs';
import {
    catchError,
    map,
    tap,
    flatMap,
    defaultIfEmpty,
    pluck,
} from 'rxjs/operators';
import { skipFalsy } from '../operator/function';

@Injectable()
export class NotificationGuard implements CanActivate {
    constructor(private readonly notificationService: NotificationService) {}

    canActivate(context: ExecutionContext) {
        const {
            user,
            params: { id },
        } = context.switchToHttp().getRequest();

        return this.notificationService.getById(id).pipe(
            pluck('receiver'),
            skipFalsy(),
            map(receiver => Types.ObjectId(user.id).equals(receiver as any)),
            defaultIfEmpty(false),
            catchError(() => of(false)),
            tap(notification => {
                if (!notification) {
                    throw new NotFoundException('Notification does not exist');
                }
            }),
        );
    }
}
