import { Module, forwardRef } from '@nestjs/common';
import { TypegooseModule } from 'nestjs-typegoose';
import { FriendRequest } from './friend-request.model';
import { FriendRequestService } from './friend-request.service';
import { FriendRequestController } from './friend-request.controller';
import { UserModule } from '../user/user.module';
import { FriendModule } from '../friend/friend.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
    imports: [
        TypegooseModule.forFeature(FriendRequest),
        FriendModule,
        UserModule,
        forwardRef(() => NotificationModule),
    ],
    controllers: [FriendRequestController],
    providers: [FriendRequestService],
    exports: [FriendRequestService],
})
export class FriendRequestModule {}
