import { forwardRef, Module } from '@nestjs/common';
import { TypegooseModule } from 'nestjs-typegoose';
import { FriendRequestModule } from '../friend-request/friend-request.module';
import { UserModule } from '../user/user.module';
import { NotificationController } from './notification.controller';
import { Notification } from './notification.model';
import { NotificationService } from './notification.service';

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
