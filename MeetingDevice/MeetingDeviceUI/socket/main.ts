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
    const app = await NestFactory.create(AppModule);

    app.enableCors();

    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Accept');
        next();
    });

    await app.listen(port);
}
