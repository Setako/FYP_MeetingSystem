import { arrayProp, prop, Ref, Typegoose } from "typegoose";
import { MeetingDevice } from "./meeting-device";
import { User } from "./user";

export class Attendance {
    public user: Ref<User>;

    public arrivalTime?: Date;

    public status?: string;
}

export enum MeetingStatus {
    Draft = "draft",
    Planned = "planned",
    Confirmed = "confirmed",
    Started = "started",
    Ended = "ended",
}

export class Meeting extends Typegoose {

    @prop({
        required: true,
    })
    public title: string;

    @prop({
        required: true,
        enum: MeetingStatus,
    })
    public status: string;

    @prop()
    public location?: string;

    @prop({
        required: true,
    })
    public priority: number;

    @prop({
        required: true,
    })
    public plannedStartTime: Date;

    @prop()
    public realStartTime?: Date;

    @prop({
        required: true,
    })
    public plannedEndTime: Date;

    @prop()
    public realEndTime?: Date;

    @prop({
        ref: MeetingDevice,
    })
    public device?: Ref<MeetingDevice>;

    @prop({
        required: true,
        default: "en-US",
    })
    public language: string;

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
