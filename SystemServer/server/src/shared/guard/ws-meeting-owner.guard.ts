import { Injectable, ExecutionContext } from '@nestjs/common';
import { MeetingOwnerGuard } from './meeting-owner.guard';
import { tap, flatMap, mapTo } from 'rxjs/operators';
import { Socket } from 'socket.io';

@Injectable()
export class WsMeetingOwnerGuard extends MeetingOwnerGuard {
    canActivate(context: ExecutionContext) {
        const { meetingId } = context.switchToWs().getData();
        const {
            request: { user, meeting },
        } = context.switchToWs().getClient();

        const client: Socket = context.switchToWs().getClient();
        const bindMeeting = this.meetingService
            .getById(meetingId ? meetingId : meeting.id)
            .pipe(tap(_meeting => (client.request.meeting = _meeting)));

        return this.validate(
            meetingId ? meetingId : meeting ? meeting.id : undefined,
            user.id,
        ).pipe(flatMap(item => bindMeeting.pipe(mapTo(item))));
    }
}
