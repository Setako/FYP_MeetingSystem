import { Module } from '@nestjs/common';
import { TypegooseModule } from 'nestjs-typegoose';
import { DeviceController } from './device.controller';
import { Device } from './device.model';
import { DeviceService } from './device.service';

@Module({
    imports: [TypegooseModule.forFeature(Device)],
    controllers: [DeviceController],
    providers: [DeviceService],
    exports: [DeviceService],
})
export class DeviceModule {}
