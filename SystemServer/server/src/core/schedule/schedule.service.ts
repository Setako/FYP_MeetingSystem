import { Injectable } from '@nestjs/common';
import { NotificationService } from '../notification/notification.service';
import { MeetingService } from '../meeting/meeting.service';
import { MeetingStatus } from '../meeting/meeting.model';
import { timer, Subscription } from 'rxjs';
import { flatMap } from 'rxjs/operators';

@Injectable()
export class ScheduleService {
    private meetingReminderSchedule: Subscription;

    constructor(
        private readonly notificationService: NotificationService,
        private readonly meetingService: MeetingService,
    ) {
        this.startMeetingReminderSchedule();
    }

    private findAndSendMeetingReminder() {
        const now = new Date();
        return this.meetingService
            .findAll({
                status: MeetingStatus.Confirmed,
                plannedStartTime: {
                    $gte: new Date(now.getTime() - 5 * 60000),
                    $lte: new Date(now.getTime() + 5 * 60000),
                },
            })
            .pipe(
                flatMap(item =>
                    this.notificationService.sendMeetingReminderEmail(item.id),
                ),
            );
    }

    startMeetingReminderSchedule() {
        if (!this.meetingReminderSchedule) {
            const now = new Date();
            const minutes = now.getMinutes();
            const addedMinutes = minutes > 30 ? 60 - minutes : 30 - minutes;

            const addedMS = addedMinutes * 60000;
            const perMs = 30 * 60000;

            this.meetingReminderSchedule = timer(addedMS, perMs)
                .pipe(flatMap(() => this.findAndSendMeetingReminder()))
                .subscribe();
        }
    }

    stopMeetingReminderSchedule() {
        if (this.meetingReminderSchedule) {
            this.meetingReminderSchedule.unsubscribe();
            this.meetingReminderSchedule = null;
        }
    }
}
