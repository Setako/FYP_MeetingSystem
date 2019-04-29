import { Injectable, ExecutionContext, CanActivate } from '@nestjs/common';
import {
    tap,
    flatMap,
    map,
    pluck,
    filter,
    defaultIfEmpty,
} from 'rxjs/operators';
import { Socket } from 'socket.io';
import { MeetingService } from '@commander/core/meeting/meeting.service';
import { of, identity } from 'rxjs';
import { Types } from 'mongoose';
import { InstanceType } from 'typegoose';
import { User } from '@commander/core/user/user.model';
import { Meeting } from '@commander/core/meeting/meeting.model';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class WsMeetingParticipantGuard implements CanActivate {
    constructor(private readonly meetingService: MeetingService) {}

    canActivate(context: ExecutionContext) {
        const { meetingId } = context.switchToWs().getData();
        const {
            request: { user, meeting },
        }: {
            request: {
                user: InstanceType<User>;
                meeting: InstanceType<Meeting>;
            };
        } = context.switchToWs().getClient();

        const client: Socket = context.switchToWs().getClient();
        const bindMeeting = this.meetingService
            .getById(meetingId ? meetingId : meeting.id)
            .pipe(tap(_meeting => (client.request.meeting = _meeting)));

        const checkId = meetingId
            ? meetingId
            : meeting
            ? meeting.id
            : undefined;
        if (!checkId) {
            return of(false);
        }

        return this.meetingService.getById(checkId).pipe(
            pluck('attendance'),
            flatMap(identity),
            filter(item => Types.ObjectId(user.id).equals(item.user as any)),
            defaultIfEmpty(null),
            tap(item => {
                if (!item) {
                    throw new WsException(
                        'you are not the participant of meeting',
                    );
                }
            }),
            flatMap(() => bindMeeting),
            map(() => true),
        );
    }
}
