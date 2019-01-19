import { Module } from '@nestjs/common';
import { TypegooseModule } from 'nestjs-typegoose';
import { DeviceController } from './device.controller';
import { Device } from './device.model';
import { DeviceService } from './device.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
    imports: [
        JwtModule.register({
            secretOrPrivateKey: process.env.TOKEN_SECRET || 'tokenSecret',
            signOptions: {
                expiresIn: '1m',
            },
        }),
        TypegooseModule.forFeature(Device),
    ],
    controllers: [DeviceController],
    providers: [DeviceService],
    exports: [DeviceService],
})
export class DeviceModule {}
