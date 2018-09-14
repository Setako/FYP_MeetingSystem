import { ObjectId } from "mongodb";
import { arrayProp, instanceMethod, InstanceType, prop, Ref, Typegoose } from "typegoose";
import { MeetingDevice } from "./meeting-device";
import { User } from "./user";

export class Attendance {
    public user: Ref<User>;

    public arrivalTime?: Date;

    public status?: string;
}

export class Meeting extends Typegoose {

    @prop({
        required: true,
    })
    public startTime: Date;

    @prop({
        required: true,
    })
    public endTime: Date;

    @prop({
        ref: MeetingDevice,
    })
    public device?: Ref<MeetingDevice>;

    @prop({
        ref: User,
        required: true,
    })
    public owner: Ref<User>;

    @arrayProp({
        items: Attendance,
    })
    public attendance: Attendance[];
}

export const meetingModel = new Meeting().getModelForClass(Meeting);
