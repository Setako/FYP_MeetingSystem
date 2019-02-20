import { MeetingService } from '@commander/core/meeting/meeting.service';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { of } from 'rxjs';
import { map, catchError, defaultIfEmpty, pluck } from 'rxjs/operators';
import { Types } from 'mongoose';
import { skipFalsy } from '../operator/function';

@Injectable()
export class MeetingOwnerGuard implements CanActivate {
    constructor(private readonly meetingService: MeetingService) {}

    canActivate(context: ExecutionContext) {
        const {
            user,
            params: { id },
        } = context.switchToHttp().getRequest();

        return this.validate(id, user.id);
    }

    protected validate(meetingId: string, userId: string) {
        return this.meetingService.getById(meetingId).pipe(
            pluck('owner'),
            skipFalsy(),
            map(owner => Types.ObjectId(userId).equals(owner as any)),
            catchError(() => of(false)),
            defaultIfEmpty(false),
        );
    }
}
