import { Injectable } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import { ModelType, InstanceType } from 'typegoose';
import { Device } from './device.model';
import { CreateDeviceDto } from './dto/create-device.dto';
import { from, of, empty } from 'rxjs';
import { flatMap, defaultIfEmpty } from 'rxjs/operators';

@Injectable()
export class DeviceService {
    constructor(
        @InjectModel(Device) private readonly deviceModel: ModelType<Device>,
    ) {}

    async getById(id: string) {
        return this.deviceModel.findById(id).exec();
    }

    async getAll(options = {}) {
        return this.deviceModel.find(options).exec();
    }

    async getOne(options = []) {
        return this.deviceModel.findOne(options).exec();
    }

    async create(createDeviceDto: CreateDeviceDto) {
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
}
