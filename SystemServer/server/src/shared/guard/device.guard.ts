import {
    CanActivate,
    ExecutionContext,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { DeviceService } from '@commander/core/device/device.service';

@Injectable()
export class DeviceGuard implements CanActivate {
    constructor(private readonly deviceService: DeviceService) {}

    canActivate(context: ExecutionContext) {
        const {
            params: { id },
        } = context.switchToHttp().getRequest();

        return this.deviceService.countDocumentsByIds([id]).pipe(
            catchError(() => of(0)),
            tap(item => {
                if (item === 0) {
                    throw new NotFoundException('Device does not exist');
                }
            }),
            map(Boolean),
        );
    }
}
