import { Module } from '@nestjs/common';
import { TypegooseModule } from 'nestjs-typegoose';
import { UserModule } from '../user/user.module';
import { MeetingController } from './meeting.controller';
import { Meeting } from './meeting.model';
import { MeetingService } from './meeting.service';
import { FriendModule } from '../friend/friend.module';

@Module({
    imports: [TypegooseModule.forFeature(Meeting), UserModule, FriendModule],
    controllers: [MeetingController],
    providers: [MeetingService],
})
export class MeetingModule {}
