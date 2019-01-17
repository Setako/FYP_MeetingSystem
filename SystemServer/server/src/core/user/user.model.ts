import crypto from 'crypto';
import {
    arrayProp,
    instanceMethod,
    ModelType,
    prop,
    Ref,
    staticMethod,
    Typegoose,
} from 'typegoose';

export class Relation {
    public attendee: Ref<User>;

    public recordStartDate: Date;

    public latesMeetingDate: Date;

    public meetingCount: number;

    constructor(
        attendee: Ref<User>,
        recordStartDate: Date,
        latesMeetingDate: Date,
        meetingCount: number,
    ) {
        this.attendee = attendee;
        this.recordStartDate = recordStartDate;
        this.latesMeetingDate = latesMeetingDate;
        this.meetingCount = meetingCount;
    }
}

export class CalendarImportance {
    public carlendarId!: string;

    public importance!: number;
}

export class NotificationSetting {
    email!: boolean;
    notification!: boolean;
}

export class UserSetting {
    public markEventOnCalendarId?: string;

    public calendarImportance: CalendarImportance[];

    public notification: {
        friendRequest: NotificationSetting;
        meetingInfoUpdate: NotificationSetting;
        meetingInvitation: NotificationSetting;
        meetingCancelled: NotificationSetting;
        meetingReminder: NotificationSetting;
    };

    constructor(partial: Partial<UserSetting> = {}) {
        if (partial.markEventOnCalendarId) {
            this.markEventOnCalendarId = partial.markEventOnCalendarId;
        }
        this.calendarImportance = partial.calendarImportance
            ? partial.calendarImportance
            : [];
        this.notification = partial.notification
            ? partial.notification
            : {
                  friendRequest: {
                      email: true,
                      notification: true,
                  },
                  meetingInfoUpdate: {
                      email: true,
                      notification: true,
                  },
                  meetingInvitation: {
                      email: true,
                      notification: true,
                  },
                  meetingCancelled: {
                      email: true,
                      notification: true,
                  },
                  meetingReminder: {
                      email: true,
                      notification: true,
                  },
              };
    }
}

export class User extends Typegoose {
    @staticMethod
    public static async findByUsername(
        this: ModelType<User> & typeof User,
        username: string,
    ) {
        return this.findOne({
            username,
        });
    }

    @staticMethod
    public static async isUsernameExist(
        this: ModelType<User> & typeof User,
        username: string,
    ) {
        return !!(await this.findByUsername(username));
    }

    @staticMethod
    public static async isEmailExist(
        this: ModelType<User> & typeof User,
        email: string,
    ) {
        return !!(await this.findOne({ email }));
    }

    @staticMethod
    public static encryptPassword(password: string, salt: string) {
        return crypto
            .createHash('md5')
            .update(password + salt)
            .digest('hex');
    }

    @instanceMethod
    public checkPassword(password: string) {
        return this.password === User.encryptPassword(password, this.salt);
    }

    @prop({
        required: true,
        unique: true,
        index: true,
        maxlength: 20,
        minlength: 2,
        lowercase: true,
    } as any)
    public username!: string;

    @prop({
        required: true,
        minlength: 8,
        maxlength: 60,
    })
    public password!: string;

    @prop({
        required: true,
    })
    public salt!: string;

    @prop({
        required: true,
        minlength: 2,
        maxlength: 20,
    })
    public displayName!: string;

    @prop({
        required: true,
        unique: true,
    })
    public email!: string;

    @prop({
        required: true,
    })
    public tokenVerificationCode!: string;

    @prop()
    public googleRefreshToken?: string;

    @prop()
    public avatar?: string;

    @arrayProp({
        items: Relation,
        default: [],
    })
    public userMeetingRelation!: Relation[];

    @prop({
        required: true,
        default: new UserSetting(),
    })
    public setting!: UserSetting;
}
