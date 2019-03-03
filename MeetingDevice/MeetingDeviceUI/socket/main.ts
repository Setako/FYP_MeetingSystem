import { NestFactory } from '@nestjs/core';
import { IpcMain, WebContents } from 'electron';
import { AppModule } from './app.module';
import { CoreModule } from './core/core.module';

export async function startNest(
    port = 3000,
    ipcMain: IpcMain,
    webContents: WebContents,
    global: any,
) {
    const app = await NestFactory.create(AppModule, {
        import: [CoreModule.forRoot(ipcMain, webContents, global)],
    });

    app.listen(port);
}
