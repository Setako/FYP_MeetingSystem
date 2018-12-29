import { NotificationService } from '@commander/core/notification/notification.service';
import { User } from '@commander/core/user/user.model';
import {
    CanActivate,
    ExecutionContext,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { from, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { InstanceType } from 'typegoose';

@Injectable()
export class NotificationGuard implements CanActivate {
    constructor(private readonly notificationService: NotificationService) {}

    async canActivate(context: ExecutionContext) {
        const request = context.switchToHttp().getRequest();

        const { id } = request.params;
        const user: InstanceType<User> = request.user;

        const notification = await from(this.notificationService.getById(id))
            .pipe(catchError(() => of(undefined)))
            .toPromise();

        if (!notification) {
            throw new NotFoundException('Notification does not exist');
        }

        return (notification.receiver as Types.ObjectId).equals(user._id);
    }
}
