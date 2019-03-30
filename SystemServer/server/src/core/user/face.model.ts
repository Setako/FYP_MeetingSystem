import { Typegoose, prop, InstanceType } from 'typegoose';
import { User } from './user.model';

export enum FaceStatus {
    Waiting = 'waiting',
    Trained = 'trained',
    Invalid = 'invalid',
}

export class Face extends Typegoose {
    @prop({
        required: true,
    })
    public imageName: string;

    @prop({
        ref: User,
        required: true,
    })
    public owner: InstanceType<User>;

    @prop({
        required: true,
        enum: FaceStatus,
        default: FaceStatus.Waiting,
    })
    public status: FaceStatus;
}
