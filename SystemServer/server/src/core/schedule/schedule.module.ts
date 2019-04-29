import { Module } from '@nestjs/common';
import { NotificationModule } from '../notification/notification.module';
import { MeetingModule } from '../meeting/meeting.module';
import { ScheduleService } from './schedule.service';

@Module({
    imports: [MeetingModule, NotificationModule],
    controllers: [],
    providers: [ScheduleService],
    exports: [ScheduleService],
})
export class ScheduleModule {}
