import { MeetingService } from '@commander/core/meeting/meeting.service';
import {
    CanActivate,
    ExecutionContext,
    Injectable,
} from '@nestjs/common';
import { from } from 'rxjs';
import { map } from 'rxjs/operators';
import { Types } from 'mongoose';

@Injectable()
export class MeetingOwnerGuard implements CanActivate {
    constructor(private readonly meetingService: MeetingService) {}

    canActivate(context: ExecutionContext) {
        const {
            user,
            params: { id },
        } = context.switchToHttp().getRequest();

        return from(this.meetingService.getById(id)).pipe(
            map(item => (item.owner as Types.ObjectId).equals(user.id)),
        );
    }
}
