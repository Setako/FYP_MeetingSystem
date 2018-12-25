import { Module } from '@nestjs/common';
import { TypegooseModule } from 'nestjs-typegoose';
import { Friend } from './friend.model';
import { FriendService } from './friend.service';
import { UserModule } from '../user/user.module';
import { FriendController } from './friend.controller';

@Module({
    imports: [TypegooseModule.forFeature(Friend), UserModule],
    controllers: [FriendController],
    providers: [FriendService],
    exports: [FriendService],
})
export class FriendModule {}
