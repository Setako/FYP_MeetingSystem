import { Injectable } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import { ModelType, InstanceType } from 'typegoose';
import { Device } from './device.model';
import { from, of, empty, defer, identity } from 'rxjs';
import { flatMap, defaultIfEmpty, map } from 'rxjs/operators';
import { JwtService } from '@nestjs/jwt';
import { DeviceSeceretDto } from './dto/device-secret.dto';
import { Types } from 'mongoose';

@Injectable()
export class DeviceService {
    constructor(
        @InjectModel(Device) private readonly deviceModel: ModelType<Device>,
        private readonly jwtService: JwtService,
    ) {}

    async getById(id: string) {
        return this.deviceModel.findById(id).exec();
    }

    getAll(options = {}) {
        return defer(() => this.deviceModel.find(options).exec()).pipe(
            flatMap(identity),
        );
    }

    async getOne(options = []) {
        return this.deviceModel.findOne(options).exec();
    }

    async countDocumentsByIds(ids: string[]) {
        return this.deviceModel
            .find({
                _id: {
                    $in: ids,
                },
            })
            .countDocuments()
            .exec();
    }

    async create(createDeviceDto: DeviceSeceretDto) {
        const device = new this.deviceModel({
            ...createDeviceDto,
        });

        return device.save();
    }

    async delete(id: string) {
        return from(this.deviceModel.findById(id).exec())
            .pipe(
                flatMap(device => (device ? of(device) : empty())),
                flatMap(device => device.remove()),
                defaultIfEmpty(null as null | InstanceType<Device>),
            )
            .toPromise();
    }

    signToken(id: string) {
        return this.jwtService.sign({ deviceId: id });
    }

    verifyToken(token: string) {
        return this.jwtService.verify(token);
    }

    decodeToken(token: string) {
        return (this.jwtService.decode(token) as any).deviceId;
    }

    isDeviceSeceretAvailable(id: string, seceret: string) {
        return defer(() =>
            this.deviceModel
                .find({
                    $and: [{ _id: Types.ObjectId(id) }, { seceret }],
                })
                .countDocuments()
                .exec(),
        ).pipe(map(Boolean));
    }
}
