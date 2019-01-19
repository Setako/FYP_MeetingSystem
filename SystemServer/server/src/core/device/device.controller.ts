import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    UseGuards,
    Put,
    BadRequestException,
} from '@nestjs/common';
import { DeviceService } from './device.service';
import { DeviceGuard } from '@commander/shared/guard/device.guard';
import { DeviceSeceretDto } from './dto/device-secret.dto';
import { of } from 'rxjs';
import { tap, map, concatAll, toArray } from 'rxjs/operators';
import { AuthGuard } from '@nestjs/passport';

@Controller('device')
export class DeviceController {
    constructor(private readonly deviceService: DeviceService) {}

    @Get()
    @UseGuards(AuthGuard('jwt'))
    async getAll() {
        return this.deviceService.getAll().pipe(
            map(device => device.id),
            toArray(),
            map(items => ({
                items,
            })),
        );
    }

    @Post()
    @UseGuards(AuthGuard('jwt'))
    async create(@Body() deviceSecretDto: DeviceSeceretDto) {
        const device = await this.deviceService.create(deviceSecretDto);
        return {
            id: device.id,
        };
    }

    @Delete(':id')
    @UseGuards(AuthGuard('jwt'))
    @UseGuards(DeviceGuard)
    async delete(@Param('id') id: string) {
        return this.deviceService.delete(id);
    }

    @Put(':id/start-token')
    @UseGuards(DeviceGuard)
    async getStartToken(
        @Param('id') id: string,
        @Body() deviceSecretDto: DeviceSeceretDto,
    ) {
        const checkSecret$ = this.deviceService
            .isDeviceSeceretAvailable(id, deviceSecretDto.seceret)
            .pipe(
                tap(available => {
                    if (!available) {
                        throw new BadRequestException(
                            'device seceret is not available',
                        );
                    }
                }),
            );

        const token$ = of(id).pipe(
            map(deviceid => ({
                token: this.deviceService.signToken(deviceid),
            })),
        );

        return of(checkSecret$, token$).pipe(concatAll());
    }
}
