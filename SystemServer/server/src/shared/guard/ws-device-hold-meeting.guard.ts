import { Injectable, ExecutionContext, CanActivate } from '@nestjs/common';
import { MeetingService } from '@commander/core/meeting/meeting.service';
import { WsException } from '@nestjs/websockets';
import { InstanceType } from 'typegoose';
import { Device } from '@commander/core/device/device.model';
import { Meeting } from '@commander/core/meeting/meeting.model';
import { map, defaultIfEmpty, catchError } from 'rxjs/operators';
import { skipFalsy } from '../operator/function';
import { Types } from 'mongoose';
import { of } from 'rxjs';

@Injectable()
export class WsDeviceHoldMeetingGuard implements CanActivate {
    constructor(private readonly meetingService: MeetingService) {}

    canActivate(context: ExecutionContext) {
        const {
            request: { device, meeting },
        }: {
            request: {
                device: InstanceType<Device>;
                meeting: InstanceType<Meeting>;
            };
        } = context.switchToWs().getClient();

        if (!device) {
            throw new WsException(
                'device should first emit <device-online> to the server.',
            );
        }

        if (!meeting) {
            throw new WsException('device should first connect to client');
        }

        return this.meetingService.getById(meeting.id).pipe(
            skipFalsy(),
            map(item => Types.ObjectId(device.id).equals(item.device as any)),
            defaultIfEmpty(false),
            catchError(() => of(false)),
        );
    }
}
