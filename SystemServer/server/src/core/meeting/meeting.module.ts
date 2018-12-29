import { Module } from '@nestjs/common';
import { TypegooseModule } from 'nestjs-typegoose';
import { UserModule } from '../user/user.module';
import { MeetingController } from './meeting.controller';
import { Meeting } from './meeting.model';
import { MeetingService } from './meeting.service';

@Module({
    imports: [TypegooseModule.forFeature(Meeting), UserModule],
    controllers: [MeetingController],
    providers: [MeetingService],
})
export class MeetingModule {}
