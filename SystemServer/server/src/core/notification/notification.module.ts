import { Module, forwardRef } from '@nestjs/common';
import { TypegooseModule } from 'nestjs-typegoose';
import { Notification } from './notification.model';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { FriendRequestModule } from '../friend-request/friend-request.module';
import { UserModule } from '../user/user.module';

@Module({
    imports: [
        TypegooseModule.forFeature(Notification),
        forwardRef(() => FriendRequestModule),
        UserModule,
    ],
    controllers: [NotificationController],
    providers: [NotificationService],
    exports: [NotificationService],
})
export class NotificationModule {}
