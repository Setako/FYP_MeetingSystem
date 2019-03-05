import { Module } from '@nestjs/common';
import { IpcService } from './ipc.service';
import { CoreGateway } from './core.gateway';
import { ConfigService } from './config.service';

@Module({
    providers: [CoreGateway, IpcService, ConfigService],
})
export class CoreModule {}
