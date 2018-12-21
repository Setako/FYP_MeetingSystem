import { Module } from '@nestjs/common';
import { TypegooseModule } from 'nestjs-typegoose';
import { MeetingController } from './meeting.controller';
import { MeetingService } from './meeting.service';
import { Meeting } from './meeting.model';
import { UserModule } from '../user/user.module';

@Module({
    imports: [TypegooseModule.forFeature(Meeting), UserModule],
    controllers: [MeetingController],
    providers: [MeetingService],
})
export class MeetingModule {}
