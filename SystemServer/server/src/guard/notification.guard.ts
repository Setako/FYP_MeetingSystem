import {
    Injectable,
    CanActivate,
    ExecutionContext,
    NotFoundException,
} from '@nestjs/common';
import { from, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { NotificationService } from '../core/notification/notification.service';
import { InstanceType } from 'typegoose';
import { User } from '../core/user/user.model';
import { Types } from 'mongoose';

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
