import { Module } from '@nestjs/common';
import { TypegooseModule } from 'nestjs-typegoose';
import { DeviceController } from './device.controller';
import { DeviceService } from './device.service';
import { Device } from './device.model';

@Module({
    imports: [TypegooseModule.forFeature(Device)],
    controllers: [DeviceController],
    providers: [DeviceService],
})
export class DeviceModule {}
