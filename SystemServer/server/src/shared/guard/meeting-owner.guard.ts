import { MeetingService } from '@commander/core/meeting/meeting.service';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { from, of, empty } from 'rxjs';
import { map, flatMap, catchError, defaultIfEmpty } from 'rxjs/operators';
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
            flatMap(item => (item ? of(item.owner) : empty())),
            map(owner => Types.ObjectId(user.id).equals(owner as any)),
            defaultIfEmpty(false),
            catchError(() => of(false)),
        );
    }
}
