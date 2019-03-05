import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

export async function startNest(port = 3000) {
    const app = await NestFactory.create(AppModule);

    app.enableCors();

    await app.listen(port);
}
