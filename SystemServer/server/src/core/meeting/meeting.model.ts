import { arrayProp, prop, Ref, Typegoose, pre } from 'typegoose';
import { Device } from '../device/device.model';
import { User } from '../user/user.model';
import { Types } from 'mongoose';

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

    @prop()
    public isFitTrainedModel?: boolean;
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

export enum ResourcesSharing {
    None = 'none',
    PreMeeting = 'pre_meeting',
    InMeeting = 'in_meeting',
    PostMeeting = 'post_meeting',
}

export class GoogleDriveResource {
    resId: string;
    sharing: ResourcesSharing;
}

export class Resources {
    googleDriveResources: GoogleDriveResource[];

    constructor() {
        this.googleDriveResources = [];
    }
}

export class UserSharedResources {
    @prop({
        ref: User,
    })
    sharer: Ref<User>;

    @prop()
    resources: Resources;
}

export class MeetingResources {
    @prop()
    main: Resources;

    @arrayProp({
        _id: false,
        items: UserSharedResources,
    })
    user: UserSharedResources[];

    group: Array<[string, Resources]>;

    constructor() {
        this.main = new Resources();
        this.user = [];
        this.group = [];
    }
}

@pre<Meeting>('save', function(next) {
    if (this.plannedStartTime && this.length) {
        this.plannedEndTime = new Date(
            new Date(this.plannedStartTime).getTime() + this.length,
        );
    }
    next();
})
@pre<Meeting>('save', function(next) {
    const users = this.resources.user.map(
        item => item.sharer as Types.ObjectId,
    );

    const invitations = this.invitations
        .filter(item => item.status !== InvitationStatus.Declined)
        .map(item => item.user as Types.ObjectId);

    const attendance = this.attendance.map(item => item.user as Types.ObjectId);

    const notExistUser = users.filter(user => {
        return !(
            user.equals(this.owner as any) ||
            invitations.some(item => user.equals(item)) ||
            attendance.some(item => user.equals(item))
        );
    });

    if (notExistUser.length) {
        this.resources.user = this.resources.user.filter(user =>
            notExistUser.some(notExist => notExist.equals(user.sharer as any)),
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

    @prop({
        _id: false,
        required: true,
        default: () => new MeetingResources(),
    })
    public resources: MeetingResources;

    @prop()
    public trainedModelPath?: string;

    @prop()
    public agendaGoogleResourceId?: string;
}
