import dotenv from 'dotenv';
dotenv.config();

import logger from 'morgan';
import { NestFactory, FastifyAdapter } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from './pipe/validation.pipe';
import { IsAlphanumeric } from 'class-validator';

declare const module: any;

async function bootstrap() {
    const app = await NestFactory.create(AppModule, new FastifyAdapter());

    app.setGlobalPrefix('/api')
        // .useStaticAssets('public')
        .useGlobalPipes(
            new ValidationPipe({
                transform: true,
            }),
        );

    if (process.env.NODE_ENV === 'development') {
        app.use(logger('dev')).enableCors();
    }

    await app.listen(process.env.PORT || 3000, '0.0.0.0');

    if (module.hot) {
        module.hot.accept();
        module.hot.dispose(() => app.close());
    }
}

bootstrap();
