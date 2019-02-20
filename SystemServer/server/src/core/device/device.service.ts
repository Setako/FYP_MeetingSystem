import { Injectable } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import { ModelType } from 'typegoose';
import { Device } from './device.model';
import { from, of, identity } from 'rxjs';
import { flatMap, map } from 'rxjs/operators';
import { JwtService } from '@nestjs/jwt';
import { DeviceSecretDto } from './dto/device-secret.dto';
import { Types } from 'mongoose';
import { skipFalsy } from '@commander/shared/operator/function';

@Injectable()
export class DeviceService {
    constructor(
        @InjectModel(Device) private readonly deviceModel: ModelType<Device>,
        private readonly jwtService: JwtService,
    ) {}

    getById(id: string) {
        return of(id).pipe(
            flatMap(deviceId => this.deviceModel.findById(deviceId).exec()),
        );
    }

    getAll(options = {}) {
        return of(options).pipe(
            flatMap(conditions => this.deviceModel.find(conditions).exec()),
            flatMap(identity),
        );
    }

    getOne(options = []) {
        return of(options).pipe(
            flatMap(conditions => this.deviceModel.findOne(conditions).exec()),
        );
    }

    countDocumentsByIds(ids: string[]) {
        return of({ _id: { $in: ids } }).pipe(
            flatMap(conditions =>
                this.deviceModel
                    .find(conditions)
                    .countDocuments()
                    .exec(),
            ),
        );
    }

    async create(createDeviceDto: DeviceSecretDto) {
        const device = new this.deviceModel({
            ...createDeviceDto,
        });

        return device.save();
    }

    async delete(id: string) {
        return from(this.deviceModel.findById(id).exec())
            .pipe(
                skipFalsy(),
                flatMap(device => device.remove()),
            )
            .toPromise();
    }

    signToken(id: string) {
        return this.jwtService.sign({ deviceId: id });
    }

    verifyToken(token: string) {
        return this.jwtService.verify(token);
    }

    decodeToken(token: string): string {
        return (this.jwtService.decode(token) as any).deviceId;
    }

    isDeviceSecretAvailable(id: string, secret: string) {
        return of({ $and: [{ _id: Types.ObjectId(id) }, { secret }] }).pipe(
            flatMap(conditions =>
                this.deviceModel
                    .find(conditions)
                    .countDocuments()
                    .exec(),
            ),
            map(Boolean),
        );
    }
}
