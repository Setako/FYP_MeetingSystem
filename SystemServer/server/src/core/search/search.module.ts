import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { MeetingModule } from '../meeting/meeting.module';
import { SearchController } from './search.controller';

@Module({
    imports: [UserModule, MeetingModule],
    controllers: [SearchController],
})
export class SearchModule {}
