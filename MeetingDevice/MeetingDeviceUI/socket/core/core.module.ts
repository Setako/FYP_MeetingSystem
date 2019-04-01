import { Module, HttpModule } from '@nestjs/common';
import { IpcService } from './ipc.service';
import { CoreGateway } from './core.gateway';
import { ConfigService } from './config.service';

@Module({
    imports: [HttpModule],
    providers: [CoreGateway, IpcService, ConfigService],
})
export class CoreModule {}
