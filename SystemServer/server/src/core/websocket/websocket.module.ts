import { Module } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateway';
import { DeviceModule } from '../device/device.module';
import { MeetingModule } from '../meeting/meeting.module';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { TrainningServerSocket } from './trainning-server.socket';

@Module({
    imports: [DeviceModule, MeetingModule, AuthModule, UserModule],
    providers: [WebsocketGateway, TrainningServerSocket],
})
export class WebsocketModule {}
