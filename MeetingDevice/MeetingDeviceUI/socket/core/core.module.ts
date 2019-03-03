import { Module, DynamicModule } from '@nestjs/common';
import { IpcMain, WebContents } from 'electron';
import { CoreService } from './core.service';
import { CoreGateway } from './core.gateway';

@Module({
    providers: [CoreService],
})
export class CoreModule {
    static forRoot(
        ipcMain: IpcMain,
        webContents: WebContents,
        global: any,
    ): DynamicModule {
        const coreService = new CoreService(ipcMain, webContents, global);
        return {
            module: CoreModule,
            providers: [
                {
                    provide: CoreService,
                    useValue: coreService,
                },
                {
                    provide: CoreGateway,
                    useValue: new CoreGateway(coreService),
                },
            ],
            exports: [CoreService],
        };
    }
}
