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
import { DeviceSecretDto } from './dto/device-secret.dto';
import { of, from } from 'rxjs';
import { tap, map, concatAll, toArray } from 'rxjs/operators';

@Controller('device')
export class DeviceController {
    constructor(private readonly deviceService: DeviceService) {}

    @Get()
    getAll() {
        return this.deviceService.getAll().pipe(
            map(({ id }) => id),
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

    @Put(':id/start-token')
    @UseGuards(DeviceGuard)
    async getStartToken(
        @Param('id') id: string,
        @Body() deviceSecretDto: DeviceSecretDto,
    ) {
        const checkSecret$ = this.deviceService
            .isDeviceSecretAvailable(id, deviceSecretDto.secret)
            .pipe(
                tap(available => {
                    if (!available) {
                        throw new BadRequestException(
                            'device secret is not available',
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
