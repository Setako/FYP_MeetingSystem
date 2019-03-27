import { Injectable, ExecutionContext, CanActivate } from '@nestjs/common';
import { InstanceType } from 'typegoose';
import { User } from '@commander/core/user/user.model';
import { Meeting, MeetingStatus } from '@commander/core/meeting/meeting.model';
import { MeetingService } from '@commander/core/meeting/meeting.service';
import { filter, flatMap, tap, mapTo, defaultIfEmpty } from 'rxjs/operators';
import { Types } from 'mongoose';
import { of } from 'rxjs';

@Injectable()
export class WsDisconnectMeetingGuard implements CanActivate {
    constructor(private readonly meetingService: MeetingService) {}

    canActivate(context: ExecutionContext) {
        const {
            request: { user, meeting },
        }: {
            request: {
                user: InstanceType<User>;
                meeting: InstanceType<Meeting>;
            };
        } = context.switchToWs().getClient();

        const client = context.switchToWs().getClient();

        if (user && meeting) {
            return this.meetingService.getById(meeting.id).pipe(
                filter(item => item.status === MeetingStatus.Started),
                filter(item =>
                    Types.ObjectId(user.id).equals(item.owner as any),
                ),
                flatMap(item => {
                    item.realEndTime = new Date();
                    item.status = MeetingStatus.Ended;
                    return item.save();
                }),
                tap(item => {
                    client
                        .to(`meeting:${item.id}_device`)
                        .emit('client-end-meeting');
                }),
                mapTo(true),
                defaultIfEmpty(true),
            );
        }

        return of(true);
    }
}
