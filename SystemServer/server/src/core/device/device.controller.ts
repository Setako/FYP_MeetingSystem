import {
    Controller,
    Get,
    Post,
    Body,
    UseGuards,
    Param,
    Delete,
} from '@nestjs/common';
import { DeviceService } from './device.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateDeviceDto } from './dto/create-device.dto';

@Controller('device')
@UseGuards(AuthGuard('jwt'))
export class DeviceController {
    constructor(private readonly deviceService: DeviceService) {}

    @Get()
    async getAll() {
        return this.deviceService.getAll();
    }

    @Post()
    async create(@Body() createDeviceDto: CreateDeviceDto) {
        this.deviceService.create(createDeviceDto);
    }

    @Delete(':id')
    async delete(@Param('id') id: string) {
        return this.deviceService.delete(id);
    }
}
