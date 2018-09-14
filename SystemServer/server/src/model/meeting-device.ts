import { prop, Typegoose } from "typegoose";

export class MeetingDevice extends Typegoose {

    @prop({
        required: true,
    })
    public seceret: string;
}

export const meetingDeviceModel = new MeetingDevice().getModelForClass(MeetingDevice);
