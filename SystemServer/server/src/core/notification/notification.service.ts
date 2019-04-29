import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { InjectModel } from 'nestjs-typegoose';
import { ModelType, InstanceType } from 'typegoose';
import {
    Notification,
    NotificationObjectModel,
    NotificationType,
} from './notification.model';
import { of, identity, defer, empty, from } from 'rxjs';
import { flatMap, catchError } from 'rxjs/operators';
import { MailerService } from '@nest-modules/mailer';
import { FriendRequestService } from '../friend-request/friend-request.service';
import { populate } from '@commander/shared/operator/document';
import { User } from '../user/user.model';
import { MeetingService } from '../meeting/meeting.service';
import { UserService } from '../user/user.service';
import { GoogleDriveService } from '../google/google-drive.service';
import { renderFile } from 'ejs';
import { FileUtils } from '@commander/shared/utils/file.utils';

@Injectable()
export class NotificationService {
    private readonly emailTemplate: {
        firendRequest: string;
        meetingCancelled: string;
        meetingInvitation: string;
        meetingInfoUpdate: string;
        meetingReminder: string;
    };
    private readonly emailSentFrom: string;

    constructor(
        @InjectModel(Notification)
        private readonly notificationModuel: typeof Notification &
            ModelType<Notification>,
        private readonly mailerService: MailerService,
        private readonly friendRequestService: FriendRequestService,
        private readonly meetingService: MeetingService,
        private readonly userService: UserService,
        private readonly googleDriveService: GoogleDriveService,
    ) {
        this.emailTemplate = {
            firendRequest: FileUtils.getRoot('template/friend-request.html'),
            meetingCancelled: FileUtils.getRoot(
                'template/meeting-cancelled.html',
            ),
            meetingInvitation: FileUtils.getRoot(
                'template/meeting-invitation.html',
            ),
            meetingInfoUpdate: FileUtils.getRoot(
                'template/meeting-info-update.html',
            ),
            meetingReminder: FileUtils.getRoot(
                'template/meeting-reminder.html',
            ),
        };

        const transport = JSON.parse(process.env.MAIL_TRANSPORT);
        this.emailSentFrom = transport ? transport.auth.user : undefined;
    }

    getById(id: string) {
        return of(id).pipe(
            flatMap(notificationId =>
                this.notificationModuel.findById(notificationId).exec(),
            ),
        );
    }

    getAllByReceiverId(receiverId: string, options = {}) {
        return of({ ...options, receiver: receiverId }).pipe(
            flatMap(conditions =>
                this.notificationModuel.find(conditions).exec(),
            ),
            flatMap(identity),
        );
    }

    getAllByReceiverIdWithPage(
        receiverId: string,
        pageSize: number,
        pageNum = 1,
        options = {},
    ) {
        return of({ ...options, receiver: receiverId }).pipe(
            flatMap(conditions =>
                this.notificationModuel
                    .find(conditions)
                    .skip(pageSize * (pageNum - 1))
                    .limit(pageSize)
                    .exec(),
            ),
            flatMap(identity),
        );
    }

    countDocuments(options = {}) {
        return of(options).pipe(
            flatMap(conditions =>
                this.notificationModuel
                    .find(conditions)
                    .countDocuments()
                    .exec(),
            ),
        );
    }

    countDocumentsByReceiverId(receiverId: string, options = {}) {
        return of({ ...options, receiver: receiverId }).pipe(
            flatMap(conditions =>
                this.notificationModuel
                    .find(conditions)
                    .countDocuments()
                    .exec(),
            ),
        );
    }

    async create(createDto: {
        type: NotificationType;
        time: Date;
        receiver: Types.ObjectId;
        object: Types.ObjectId;
        objectModel: NotificationObjectModel;
    }) {
        const created = new this.notificationModuel({
            ...createDto,
        });

        return created.save();
    }

    async delete(id: string) {
        return this.notificationModuel.findByIdAndDelete(id);
    }

    async deleteAllByReceiverId(receiverId: string, options = {}) {
        return this.notificationModuel.deleteMany({
            ...options,
            receiver: receiverId,
        });
    }

    async sendFirendRequestEmail(firendRequestId: string) {
        const request = await this.friendRequestService
            .getById(firendRequestId)
            .pipe(populate('user', 'targetUser'))
            .toPromise();
        const user = request.user as InstanceType<User>;
        const targetUser = request.targetUser as InstanceType<User>;

        if (!targetUser.setting.notification.meetingCancelled) {
            return;
        }

        const html: string = await renderFile(
            this.emailTemplate.firendRequest,
            {
                receiverDisplayName: targetUser.displayName,
                snederDisplayName: user.displayName,
                senderUsername: user.username,
                senderEmail: user.email,
            },
        );

        await defer(() =>
            this.mailerService.sendMail({
                from: this.emailSentFrom,
                to: targetUser.email,
                subject: '[C-Commander] firend request',
                html,
            }),
        )
            .pipe(catchError(() => empty()))
            .toPromise();
    }

    async sendMeetingCancelledEmail(meetingId: string) {
        const meeting = await this.meetingService
            .getById(meetingId)
            .pipe(populate('owner', 'attendance.user'))
            .toPromise();

        const owner = meeting.owner as InstanceType<User>;

        const attendance = meeting.attendance
            .map(item => item.user as InstanceType<User>)
            .filter(item => item.setting.notification.meetingCancelled)
            .filter(item => item.id !== owner.id);

        const withHtml = await Promise.all(
            attendance.map(async user => ({
                user,
                html: (await renderFile(this.emailTemplate.meetingCancelled, {
                    receiverDisplayName: user.displayName,
                    meeting: {
                        id: meeting.id,
                        title: meeting.title,
                        ownerDisplayName: owner.displayName,
                        status: meeting.status,
                        location: meeting.location,
                        length: meeting.length / 600000,
                        plannedDate: meeting.plannedStartTime.toLocaleString(
                            'en-us',
                            {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: 'numeric',
                                second: 'numeric',
                            },
                        ),
                    },
                })) as string,
            })),
        );

        await from(withHtml)
            .pipe(
                flatMap(({ user, html }) =>
                    this.mailerService.sendMail({
                        from: this.emailSentFrom,
                        to: user.email,
                        subject: '[C-Commander] meeting cancelled',
                        html,
                    }),
                ),
                catchError(() => empty()),
            )
            .toPromise();
    }

    async sendMeetingInvitationEmail(
        meetingId: string,
        userId?: string,
        email?: string,
    ) {
        const meeting = await this.meetingService
            .getById(meetingId)
            .pipe(populate('owner'))
            .toPromise();

        const user = userId
            ? await this.userService.getById(userId).toPromise()
            : null;

        if (user && !user.setting.notification.meetingInvitation) {
            return;
        }

        const owner = meeting.owner as InstanceType<User>;

        const file = meeting.agendaGoogleResourceId
            ? await this.googleDriveService
                  .getFile(
                      owner.googleRefreshToken,
                      meeting.agendaGoogleResourceId,
                  )
                  .toPromise()
            : null;

        const html: string = await renderFile(
            this.emailTemplate.meetingInvitation,
            {
                receiverDisplayName: user ? user.displayName : null,
                meeting: {
                    title: meeting.title,
                    ownerDisplayName: owner.displayName,
                    status: meeting.status,
                    location: meeting.location,
                    length: meeting.length / 600000,
                    plannedDate: meeting.plannedStartTime.toLocaleString(
                        'en-us',
                        {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: 'numeric',
                            second: 'numeric',
                        },
                    ),
                    agendaLink: file ? file.webViewLink : null,
                },
            },
        );

        await this.mailerService.sendMail({
            from: this.emailSentFrom,
            to: user ? user.email : email,
            subject: '[C-Commander] meeting invitation',
            html,
        });
    }

    async sendMeetingInfoUpdateEmail(meetingId: string) {
        const meeting = await this.meetingService
            .getById(meetingId)
            .pipe(populate('owner', 'attendance.user'))
            .toPromise();

        const owner = meeting.owner as InstanceType<User>;

        const users = meeting.attendance
            .map(item => item.user as InstanceType<User>)
            .filter(item => item.setting.notification.meetingInfoUpdate.email)
            .filter(({ id }) => id !== owner.id);

        const withHtml = from(users).pipe(
            flatMap(async user => ({
                user,
                html: (await renderFile(this.emailTemplate.meetingInfoUpdate, {
                    receiverDisplayName: user.displayName,
                    meeting: {
                        id: meeting.id,
                        title: meeting.title,
                        ownerDisplayName: owner.displayName,
                        status: meeting.status,
                        location: meeting.location,
                        length: meeting.length / 600000,
                        plannedDate: meeting.plannedStartTime.toLocaleString(
                            'en-us',
                            {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: 'numeric',
                                second: 'numeric',
                            },
                        ),
                    },
                })) as string,
            })),
        );

        await withHtml
            .pipe(
                flatMap(({ user, html }) =>
                    this.mailerService.sendMail({
                        from: this.emailSentFrom,
                        to: user.email,
                        subject: '[C-Commander] meeting updated',
                        html,
                    }),
                ),
                catchError(() => empty()),
            )
            .toPromise();
    }

    async sendMeetingReminderEmail(meetingId: string) {
        const meeting = await this.meetingService
            .getById(meetingId)
            .pipe(populate('owner', 'attendance.user'))
            .toPromise();

        const owner = meeting.owner as InstanceType<User>;

        const users = meeting.attendance
            .map(item => item.user as InstanceType<User>)
            .filter(item => item.setting.notification.meetingReminder.email);

        const withHtml = from(users).pipe(
            flatMap(async user => ({
                user,
                html: (await renderFile(this.emailTemplate.meetingReminder, {
                    receiverDisplayName: user.displayName,
                    meeting: {
                        id: meeting.id,
                        title: meeting.title,
                        ownerDisplayName: owner.displayName,
                        status: meeting.status,
                        location: meeting.location,
                        length: meeting.length / 600000,
                        plannedDate: meeting.plannedStartTime.toLocaleString(
                            'en-us',
                            {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: 'numeric',
                                second: 'numeric',
                            },
                        ),
                    },
                })) as string,
            })),
        );

        await withHtml
            .pipe(
                flatMap(({ user, html }) =>
                    this.mailerService.sendMail({
                        from: this.emailSentFrom,
                        to: user.email,
                        subject: '[C-Commander] meeting reminder',
                        html,
                    }),
                ),
                catchError(() => empty()),
            )
            .toPromise();
    }
}
