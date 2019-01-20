import { arrayProp, prop, Ref, Typegoose, pre } from 'typegoose';
import { Device } from '../device/device.model';
import { User } from '../user/user.model';

export enum InvitationStatus {
    Accepted = 'accepted',
    Declined = 'declined',
    Waiting = 'waiting',
}

export class Invitation {
    @prop({
        ref: User,
    })
    public user?: Ref<User>;

    @prop()
    public email?: string;

    @prop()
    public priority?: number;

    @prop({
        enum: InvitationStatus,
    })
    public status!: InvitationStatus;
}

export enum AttendanceStatus {
    Absent = 'absent',
    Present = 'present',
    Exit = 'exit',
}

export class AccessPostMeetingPermission {
    public accessShareResources: boolean;

    public accessRecordedVoice: boolean;

    public accessTextRecordOfSpeech: boolean;

    public accessAttendanceRecord: boolean;

    public makeMeetingMinute: boolean;

    public reviewMeetingMinute: boolean;

    constructor({
        accessShareResources = true,
        accessRecordedVoice = true,
        accessTextRecordOfSpeech = true,
        accessAttendanceRecord = true,
        makeMeetingMinute = true,
        reviewMeetingMinute = true,
    }: {
        accessShareResources?: boolean;
        accessRecordedVoice?: boolean;
        accessTextRecordOfSpeech?: boolean;
        accessAttendanceRecord?: boolean;
        makeMeetingMinute?: boolean;
        reviewMeetingMinute?: boolean;
    } = {}) {
        this.accessShareResources = accessShareResources;
        this.accessRecordedVoice = accessRecordedVoice;
        this.accessTextRecordOfSpeech = accessTextRecordOfSpeech;
        this.accessAttendanceRecord = accessAttendanceRecord;
        this.makeMeetingMinute = makeMeetingMinute;
        this.reviewMeetingMinute = reviewMeetingMinute;
    }
}

export class Attendance {
    @prop({
        ref: User,
        unique: true,
    })
    public user!: Ref<User>;

    @prop()
    public priority?: number;

    @prop()
    public arrivalTime?: Date;

    @prop()
    public status?: AttendanceStatus;

    @prop()
    public permission?: AccessPostMeetingPermission;

    @prop()
    public googleCalendarEventId?: string;
}

export enum MeetingPriority {
    Hight = 1,
    Medium = 2,
    Low = 3,
}

export enum MeetingStatus {
    Draft = 'draft',
    Planned = 'planned',
    Confirmed = 'confirmed',
    Cancelled = 'cancelled',
    Started = 'started',
    Ended = 'ended',
    Deleted = 'deleted',
}

export enum MeetingType {
    Speech = 'speech',
    GroupDiscussion = 'group_discussion',
    Presentation = 'presentation',
}

@pre<Meeting>('save', function(next) {
    if (this.plannedStartTime && this.length) {
        this.plannedEndTime = new Date(
            new Date(this.plannedStartTime).getTime() + this.length,
        );
    }
    next();
})
export class Meeting extends Typegoose {
    @prop({
        required: true,
    })
    public type!: string;

    @prop({
        required: true,
        minlength: 1,
    })
    public title!: string;

    @prop({
        required: true,
        enum: MeetingStatus,
    })
    public status!: MeetingStatus;

    @prop({
        required: true,
    })
    public length!: number;

    @prop()
    public description?: string;

    @prop()
    public location?: string;

    @prop()
    public plannedStartTime?: Date;

    @prop()
    public plannedEndTime?: Date;

    @prop()
    public realStartTime?: Date;

    @prop()
    public realEndTime?: Date;

    @prop({
        required: true,
        default: 'en-US',
    })
    public language!: string;

    @prop({
        required: true,
    })
    public priority!: number;

    @prop({
        ref: Device,
    })
    public device?: Ref<Device>;

    @prop({
        ref: User,
        required: true,
    })
    public owner!: Ref<User>;

    @arrayProp({
        items: Attendance,
        _id: false,
    })
    public attendance!: Attendance[];

    @arrayProp({
        items: Invitation,
    })
    public invitations!: Invitation[];

    @prop({
        required: true,
        default: () => new AccessPostMeetingPermission(),
    })
    public generalPermission!: AccessPostMeetingPermission;
}
