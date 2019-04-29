import { Module, forwardRef } from '@nestjs/common';
import { TypegooseModule } from 'nestjs-typegoose';
import { UserModule } from '../user/user.module';
import { MeetingController } from './meeting.controller';
import { Meeting } from './meeting.model';
import { MeetingService } from './meeting.service';
import { FriendModule } from '../friend/friend.module';
import { NotificationModule } from '../notification/notification.module';
import { GoogleModule } from '../google/google.module';
import { DeviceModule } from '../device/device.module';

@Module({
    imports: [
        TypegooseModule.forFeature(Meeting),
        UserModule,
        FriendModule,
        GoogleModule,
        DeviceModule,
        forwardRef(() => NotificationModule),
    ],
    controllers: [MeetingController],
    providers: [MeetingService],
    exports: [MeetingService],
})
export class MeetingModule {}
