import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    UseGuards,
} from '@nestjs/common';
import { DeviceService } from './device.service';
import { DeviceGuard } from '@commander/shared/guard/device.guard';
import { DeviceSecretDto } from './dto/device-secret.dto';
import { from } from 'rxjs';
import { map, toArray, pluck } from 'rxjs/operators';

@Controller('device')
export class DeviceController {
    constructor(private readonly deviceService: DeviceService) {}

    @Get()
    getAll() {
        return this.deviceService.getAll().pipe(
            pluck('id'),
            toArray(),
            map(items => ({
                items,
                length: items.length,
            })),
        );
    }

    @Post()
    async create(@Body() deviceSecretDto: DeviceSecretDto) {
        return from(this.deviceService.create(deviceSecretDto)).pipe(
            map(device => ({
                id: device.id,
            })),
        );
    }

    @Delete(':id')
    @UseGuards(DeviceGuard)
    async delete(@Param('id') id: string) {
        await this.deviceService.delete(id);
    }
}
