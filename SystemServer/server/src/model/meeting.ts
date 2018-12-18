import { arrayProp, prop, Ref, Typegoose } from "typegoose";
import { MeetingDevice } from "./meeting-device";
import { User } from "./user";

export class Attendance {
    public user: Ref<User>;

    public proiority: number;

    public arrivalTime?: Date;

    public status?: AttendanceStatus;

    public permission: AccessPostMeetingPermission;
}

export class Invitation extends Typegoose {
    public id: string;

    public user?: Ref<User>;

    public email?: string;

    public proiority: number;

    public status?: InvitationStatus;
}

export enum InvitationStatus {
    Accepted = "accepted",
    Declined = "declined",
    Waiting = "waiting",
}

export enum AttendanceStatus {
    Absent = "absent",
    Present = "present",
}

export enum MeetingStatus {
    Draft = "draft",
    Planned = "planned",
    Confirmed = "confirmed",
    Cancelled = "cancelled",
    Started = "started",
    Ended = "ended",
    Deleted = "deleted",
}

export enum MeetingType {
    Speech = "speech",
    GroupDiscussion = "group_discussion",
    Presentation = "presentation",
}

export class AccessPostMeetingPermission {
    public accessShareResources: boolean;

    public accessRecordedVoice: boolean;

    public accessTextRecordOfSpeech: boolean;

    public accessAttendanceRecord: boolean;

    public makeMeetingMinute: boolean;

    public reviewMeetingMinute: boolean;

    constructor(
        accessShareResources: boolean,
        accessRecordedVoice: boolean,
        accessTextRecordOfSpeech: boolean,
        accessAttendanceRecord: boolean,
        makeMeetingMinute: boolean,
        reviewMeetingMinute: boolean,
    ) {
        this.accessShareResources = accessShareResources;
        this.accessRecordedVoice = accessRecordedVoice;
        this.accessTextRecordOfSpeech = accessTextRecordOfSpeech;
        this.accessAttendanceRecord = accessAttendanceRecord;
        this.makeMeetingMinute = makeMeetingMinute;
        this.reviewMeetingMinute = reviewMeetingMinute;
    }
}

export class Meeting extends Typegoose {
    @prop({
        required: true,
    })
    public type: string;

    @prop({
        required: true,
    })
    public title: string;

    @prop({
        required: true,
        enum: MeetingStatus,
    })
    public status: string;

    @prop({
        required: true,
    })
    public length: number;

    @prop()
    public description?: string;

    @prop()
    public location?: string;

    @prop({
        required: false,
    })
    public plannedStartTime: Date;

    @prop({
        required: false,
    })
    public plannedEndTime: Date;

    @prop()
    public realStartTime?: Date;

    @prop()
    public realEndTime?: Date;

    @prop({
        required: true,
        default: "en-US",
    })
    public language: string;

    @prop({
        required: true,
    })
    public priority: number;

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
        default: [],
    })
    public attendance: Attendance[];

    @arrayProp({
        items: Invitation,
        default: [],
    })
    public invitations: Invitation[];

    @prop({
        required: true,
    })
    public generalPermission: AccessPostMeetingPermission;
}

export const meetingModel = new Meeting().getModelForClass(Meeting);
