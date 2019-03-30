import { Face, FaceStatus } from './face.model';
import { Injectable } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import { ModelType, InstanceType } from 'typegoose';
import { of, defer, identity } from 'rxjs';
import { flatMap } from 'rxjs/operators';
import { Types } from 'mongoose';
import { User } from './user.model';

@Injectable()
export class FaceService {
    constructor(
        @InjectModel(Face) private readonly faceModel: ModelType<Face>,
    ) {}

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

    create(face: {
        imageName: string;
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
