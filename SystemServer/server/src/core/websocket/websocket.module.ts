import { Module } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateway';
import { DeviceModule } from '../device/device.module';
import { MeetingModule } from '../meeting/meeting.module';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [DeviceModule, MeetingModule, AuthModule],
    providers: [WebsocketGateway],
})
export class WebsocketModule {}
