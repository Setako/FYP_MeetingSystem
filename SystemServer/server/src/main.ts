import dotenv from 'dotenv';
dotenv.config();

import logger from 'morgan';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from './shared/pipe/validation.pipe';
import { json } from 'body-parser';

declare const module: any;

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.setGlobalPrefix('/api').useGlobalPipes(
        new ValidationPipe({
            transform: true,
        }),
    );

    if (process.env.NODE_ENV === 'development') {
        app.use(logger('dev')).enableCors();
    }
    
    app.use(json({ limit: '50mb' }));

    await app.listen(process.env.PORT || 80);

    if (module.hot) {
        module.hot.accept();
        module.hot.dispose(() => app.close());
    }
}

bootstrap();
