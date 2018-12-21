import dotenv from 'dotenv';
dotenv.config();

import logger from 'morgan';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from './pipe/validation.pipe';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.setGlobalPrefix('/api')
        .useStaticAssets('public')
        .useGlobalPipes(new ValidationPipe());

    if (process.env.NODE_ENV === 'development') {
        app.use(logger('dev')).enableCors();
    }

    await app.listen(process.env.PORT || 3000);
}

bootstrap();
