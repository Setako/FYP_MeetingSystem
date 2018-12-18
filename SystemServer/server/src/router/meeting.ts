import { Request, Router } from "express";
import { DocumentQuery, Types } from "mongoose";
import path from "path";
import { InstanceType } from "typegoose";
import uuidv4 from "uuid/v4";
import {
    AccessPostMeetingPermission,
    AttendanceStatus,
    Invitation,
    InvitationStatus,
    Meeting,
    meetingModel,
    MeetingStatus,
    MeetingType,
} from "../model/meeting";
import { userModel } from "../model/user";

const router = Router();

declare interface IMeetingRequest extends Request {
    meeting: InstanceType<Meeting>;
}

function sortCursorByReq(
    cursor: DocumentQuery<Array<InstanceType<Meeting>>, InstanceType<Meeting>>,
    req: Request,
) {
    const value = req.query.sortOrder === "desc" ? -1 : 1;
    const field = req.query.sortField;
    return field != null ? cursor.sort({ field: value }) : cursor;
}

function cursorPaginationByReq(
    cursor: DocumentQuery<Array<InstanceType<Meeting>>, InstanceType<Meeting>>,
    req: Request,
) {
    const { resultPageSize, resultPageNum } = req.query;
    if (resultPageSize) {
        // const {
        //     resultPageSize,
        //     resultPageNum,
        // } = req.query;
        return cursor
            .skip(resultPageSize * (resultPageNum - 1))
            .limit(resultPageSize);
    }
    return cursor;
}

async function extractFilterQueryFromReq(req: Request) {
    const query = {} as any;

    const { status, hostedByMe, hostedByOther } = req.query;

    if (status) {
        query.status = status;
    }

    if (hostedByMe && hostedByOther) {
        query.$or = [
            {
                owner: { $eq: Types.ObjectId(req.user._id) },
            },
            {
                "attendance.user": { $eq: Types.ObjectId(req.user._id) },
            },
        ];
    } else if (!hostedByMe) {
        query.owner = {
            $not: {
                $eq: Types.ObjectId(req.user._id),
            },
        };
    } else if (hostedByOther) {
        query["attendance.user"] = { $eq: Types.ObjectId(req.user._id) };
    }

    return query;
}

router
    .get("/", async (req, res) => {
        const { resultPageNum = 1 } = req.query;

        let cursor = meetingModel.find(await extractFilterQueryFromReq(req));
        const length = await cursor.countDocuments().exec();
        cursor = sortCursorByReq(cursor, req);
        cursor = cursorPaginationByReq(cursor, req);

        const list = await cursor.find().exec();

        const items = await Promise.all(
            list.map(async (item) => ({
                id: item._id,
                type: item.type,
                title: item.title,
                status: item.status,
                description: item.description,
                location: item.location,
                plannedStartTime: item.plannedStartTime,
                plannedEndTime: item.plannedEndTime,
                realStartTime: item.realStartTime,
                realEndTime: item.realEndTime,
                language: item.language,
                priority: item.priority,
                device: item.device,
                owner: await userModel.findById(item.owner),
                attendance: await Promise.all(
                    item.attendance.map(async (att) => ({
                        ...att,
                        user: (await userModel.findById(att.user)).username,
                    })),
                ),
                generalPermission: item.generalPermission,
            })),
        );

        res.json({
            items,
            resultPageNum,
            length,
        });
    })
    .post("/", async (req, res) => {
        const missing = (...key: string[]) => {
            res.status(400).json({
                message: "Missing " + key.join(" or "),
            });
        };

        const {
            type,
            title,
            description,
            length,
            location,
            language = "en-US",
            priority = 1,
            generalPermission,
        } = req.body;

        let { attendance } = req.body;

        if (!(title && title.trim())) {
            return missing("title");
        }

        if (!Object.values(MeetingType).includes(type)) {
            return res.status(400).json({
                message: "Incorrect meeting type",
            });
        }

        const owner = await userModel.findByUsername(req.user.username);

        attendance = attendance || [];
        attendance = (await Promise.all(
            (attendance as any[]).map(async (item) => {
                item.user = await userModel.findByUsername(item.user);
                return item;
            }),
        )).filter((item) => item.user && item.user.username !== owner.username);

        // const isOwnerExist = (attendance as any[]).some(
        //     item => item.user === owner,
        // );

        // if (!isOwnerExist) {
        //     (attendance as any[]).push({
        //         user: owner,
        //     });
        // }

        // TODO: send email in here?

        const meeting = await new meetingModel({
            type,
            title,
            location,
            attendance,
            owner,
            priority,
            length,
            description,

            language,
            status: MeetingStatus.Draft,
            generalPermission:
                generalPermission ||
                new AccessPostMeetingPermission(
                    true,
                    true,
                    true,
                    true,
                    true,
                    true,
                ),
        }).save();

        res.json({
            id: meeting._id,
            title: meeting.title,
        });
    });

router
    .get("/:ids", async (req: IMeetingRequest, res) => {
        const ids = req.params.ids
            .split(";")
            .map((ele: string) => {
                try {
                    return new Types.ObjectId(ele);
                } catch {
                    return null;
                }
            })
            .filter(Boolean);

        const query = {} as any;
        query._id = { $in: ids };

        const { resultPageNum = 1 } = req.body;

        let cursor = meetingModel.find(query);
        const length = await cursor.countDocuments().exec();

        cursor = sortCursorByReq(cursor, req);
        cursor = cursorPaginationByReq(cursor, req);

        const list = await cursor.find().exec();

        const items = await Promise.all(
            list.map(async (item) => ({
                id: item._id,
                type: item.type,
                title: item.title,
                status: item.status,
                description: item.description,
                location: item.location,
                plannedStartTime: item.plannedStartTime,
                plannedEndTime: item.plannedEndTime,
                realStartTime: item.realStartTime,
                realEndTime: item.realEndTime,
                language: item.language,
                priority: item.priority,
                device: item.device,
                owner: await userModel.findById(item.owner),
                attendance: await Promise.all(
                    item.attendance.map(async (att) => ({
                        ...att,
                        user: (await userModel.findById(att.user)).username,
                    })),
                ),
                generalPermission: item.generalPermission,
            })),
        );

        res.json({
            items,
            resultPageNum,
            length,
        });
    })
    .use("/:id", async (req: IMeetingRequest, res, next) => {
        const meeting = await meetingModel.findById(req.params.id);
        if (meeting) {
            req.meeting = meeting;
            return next();
        }

        res.status(404).json({
            message: "Meeting not found",
        });
    })
    .put("/:id", async (req: IMeetingRequest, res) => {
        const meeting = req.meeting;

        const {
            type,
            title,
            description,
            length,
            location,
            status,
            plannedStartTime,
            plannedEndTime,
            realStartTime,
            realEndTime,
            priority,
            language,
            attendance,
            generalPermission,
        } = req.body;

        const owner = await userModel.findByUsername(req.user.username);

        if (attendance) {
            meeting.attendance = (await Promise.all(
                (attendance as any[]).map(async (item) => ({
                    ...item,
                    user: await userModel.findByUsername(item.user),
                })),
            )).filter(
                (item) => item.user && item.user.username !== owner.username,
            );

            // const isOwnerExist = meeting.attendance.some(
            //     item => item.user === meeting.owner,
            // );

            // if (!isOwnerExist) {
            //     meeting.attendance.push({
            //         user: meeting.owner,
            //         proiority: 1,
            //         permission: new AccessPostMeetingPermission(
            //             true,
            //             true,
            //             true,
            //             true,
            //             true,
            //             true,
            //         ),
            //     });
            // }

            // meeting.priority = meeting.attendance.length;
        }

        if (type && !Object.values(MeetingType).includes(type)) {
            return res.status(400).json({
                message: "Incorrect meeting type",
            });
        }

        if (status && !Object.values(MeetingStatus).includes(status)) {
            return res.status(400).json({
                message: "Incorrect meeting statue",
            });
        }

        meeting.type = type || meeting.type;
        meeting.title = title || meeting.title;
        meeting.status = status || meeting.status;
        meeting.description = description || description;
        meeting.length = length || length;
        meeting.location = location || meeting.location;
        meeting.plannedStartTime = plannedStartTime || meeting.plannedStartTime;
        meeting.plannedEndTime = plannedEndTime || meeting.plannedEndTime;
        meeting.language = language || meeting.language;
        meeting.priority = priority || meeting.priority;
        meeting.generalPermission =
            generalPermission || meeting.generalPermission;
        meeting.realStartTime = realStartTime || meeting.realStartTime;
        meeting.realEndTime = realEndTime || meeting.realEndTime;

        meeting.save();

        res.json({
            id: meeting._id,
            type: meeting.type,
            title: meeting.type,
            status: meeting.status,
            description: meeting.description,
            location: meeting.location,
            plannedStartTime: meeting.plannedStartTime,
            plannedEndTime: meeting.plannedEndTime,
            realStartTime: meeting.realStartTime,
            realEndTime: meeting.realEndTime,
            language: meeting.language,
            priority: meeting.priority,
            device: meeting.device,
            owner: await userModel.findById(meeting.owner),
            attendance: await Promise.all(
                meeting.attendance.map(async (att) => ({
                    ...att,
                    user: (await userModel.findById(att.user)).username,
                })),
            ),
            generalPermission: meeting.generalPermission,
        });
    })
    .delete("/:id", async (req: IMeetingRequest, res) => {
        const meeting = req.meeting;

        await meeting.remove();
        res.end();
    });

router
    .get("/:id/participant", async (req: IMeetingRequest, res) => {
        console.log("");

        res.json({
            items: req.meeting.invitations,
            length: req.meeting.invitations.length,
        });
    })
    .put("/:id/participant", async (req: IMeetingRequest, res) => {
        const { friends = [], emails = [] } = req.body;

        const meeting = req.meeting;

        meeting.invitations = meeting.invitations.concat(((await Promise.all(
            friends.map(async (friend: string) => ({
                id: uuidv4(),
                user: await userModel.findByUsername(friend),
                status: InvitationStatus.Waiting,
            })),
        )) as unknown) as Invitation[]);

        meeting.invitations = meeting.invitations.concat(
            emails.map((email: string) => ({
                id: uuidv4(),
                email,
                status: InvitationStatus.Waiting,
            })),
        );

        meeting.save();
        res.json({
            items: meeting.invitations,
            length: meeting.invitations.length,
        });
    });

router
    .get("/:id/attendance", async (req: IMeetingRequest, res) => {
        res.json(req.meeting.attendance);
    })
    .post("/:id/attendance", async (req: IMeetingRequest, res) => {
        await meetingModel.findByIdAndUpdate(req.meeting.id, {
            attendance: req.body.attendance,
        });
        res.end();
    });

router
    .use("/:id/attendance/:userId", async (req: IMeetingRequest, res, next) => {
        const user = await userModel.findById(req.params.userId);
        if (user) {
            return next();
        }

        res.status(404).json({
            message: "User not found",
        });
    })
    .get("/:id/attendance/:userId", async (req: IMeetingRequest, res) => {
        res.json(
            req.meeting.attendance.find(
                (itme) => itme.user === req.params.userId,
            ),
        );
    })
    .post("/:id/attendance/:userId", async (req: IMeetingRequest, res) => {
        const selected = req.meeting.attendance.find(
            (item) => item.user === req.params.userId,
        );
        if (!selected.status && selected.status !== AttendanceStatus.Absent) {
            selected.arrivalTime = new Date();
            selected.status = AttendanceStatus.Absent;

            await meetingModel.findByIdAndUpdate(req.meeting.id, {
                attendance: req.meeting.attendance,
            });
        }

        res.json(selected);
    });

router.get("/:id/trained-model", async (req: IMeetingRequest, res) => {
    const file = path.join(
        process.cwd(),
        "data/trained-model",
        req.params.id + ".clf",
    );
    res.download(file);
});

export const meetingRouter = router;
