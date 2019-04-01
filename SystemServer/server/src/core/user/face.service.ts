import { Face, FaceStatus } from './face.model';
import { Injectable } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import { ModelType, InstanceType } from 'typegoose';
import { of, defer, identity, Observable, fromEvent } from 'rxjs';
import { flatMap, map } from 'rxjs/operators';
import { Types } from 'mongoose';
import { User } from './user.model';

@Injectable()
export class FaceService {
    constructor(
        @InjectModel(Face) private readonly faceModel: ModelType<Face>,
    ) {}

    watchModelSave(): Observable<InstanceType<Face>> {
        return fromEvent(this.faceModel, 'save').pipe(
            map(item => (Array.isArray(item) ? item[0] : item)),
        );
    }

    getByid(id: string) {
        return of(id).pipe(
            flatMap(item => this.faceModel.findById(item).exec()),
        );
    }

    getAllByUserId(userId: string) {
        return defer(() =>
            this.faceModel.find({ owner: Types.ObjectId(userId) }),
        ).pipe(flatMap(identity));
    }

    find(conditions: Partial<Face>) {
        return defer(() => this.faceModel.find(conditions)).pipe(
            flatMap(identity),
        );
    }

    create(face: {
        name: string;
        imagePath: string;
        resultPath?: string;
        owner: string | Types.ObjectId | InstanceType<User>;
        status?: FaceStatus;
    }) {
        return of(new this.faceModel({ ...face })).pipe(
            flatMap(item => item.save()),
        );
    }

    delete(id: string) {
        return defer(() => this.faceModel.findByIdAndDelete(id));
    }
}
