import { Request, Router } from "express";
import path from "path";
import { InstanceType } from "typegoose";
import { Meeting, meetingModel, MeetingStatus } from "../model/meeting";
import { userModel } from "../model/user";

const router = Router();

declare interface IMeetingRequest extends Request {
    meeting: InstanceType<Meeting>;
}

router
    .get("/", async (req, res) => {
        const list = await meetingModel.find();
        const result = list.map((item) => ({
            _id: item._id,
            title: item.title,
        }));

        res.json(result);
    })
    .post("/", async (req, res) => {
        const missing = (...key: string[]) => {
            res.status(400).json({
                message: "Missing " + key.join(" or "),
            });
        };

        const {
            title,
            location,
            plannedStartTime,
            plannedEndTime,
            language,
        } = req.body;

        let {
            attendance,
        } = req.body;

        if (!(title && title.trim())) {
            return missing("title");
        }

        if (!plannedStartTime || !plannedEndTime) {
            return missing("plannedStartTime", "plannedEndTime");
        }

        const owner = await userModel.findByUsername(req.user.username);

        attendance = attendance || [];
        attendance = (await Promise.all(
            (attendance as any[])
                .map(async (item) => {
                    item.user = await userModel.findByUsername(item.user);
                    return item;
                }),
        )).filter((item) => item.user);

        const isOwnerExist = (attendance as any[])
            .some((item) => item.user === owner);

        if (!isOwnerExist) {
            (attendance as any[]).push({
                user: owner,
            });
        }

        // TODO: send email in here?

        const meeting = await new meetingModel({
            title,
            location,
            plannedStartTime,
            plannedEndTime,
            attendance,
            owner,

            language: language || "en-US",
            status: MeetingStatus.Draft,
            priority: attendance.length,
        }).save();

        res.json({
            _id: meeting._id,
            title: meeting.title,
            priority: meeting.priority,
        });
    });

router
    .use("/:id", async (req: IMeetingRequest, res, next) => {
        const meeting = await meetingModel.findById(req.params.id);
        if (meeting) {
            req.meeting = meeting;
            return next();
        }

        res.status(404)
            .json({
                message: "Meeting not found",
            });
    })
    .get("/:id", async (req: IMeetingRequest, res) => {
        const meeting = req.meeting;
        const attendance = await Promise.all(
            req.meeting.attendance.map(async (item) => {
                const user = await userModel.findById(item.user);
                return {
                    ...item,
                    user: user.username,
                };
            }),
        );
        const owner = await userModel.findById(meeting.owner);

        res.json({
            _id: meeting._id,
            title: meeting.title,
            status: meeting.status,
            priority: meeting.priority,
            location: meeting.location,
            plannedStartTime: meeting.plannedStartTime,
            plannedEndTime: meeting.plannedEndTime,
            realStartTime: meeting.realStartTime,
            realEndTime: meeting.realEndTime,
            language: meeting.language,
            device: meeting.device,
            owner: owner.username,
            attendance,
        });
    })
    .put("/:id", async (req: IMeetingRequest, res) => {
        const meeting = req.meeting;
        const {
            title,
            status,
            location,
            plannedStartTime,
            plannedEndTime,
            language,
            attendance,
        } = req.body;

        if (attendance) {
            meeting.attendance = await Promise.all(
                (attendance as any[])
                    .map(async (item) => ({
                        ...item,
                        user: await userModel.findByUsername(item.user),
                    })),
            );

            const isOwnerExist = meeting.attendance
                .some((item) => item.user === meeting.owner);

            if (!isOwnerExist) {
                meeting.attendance.push({
                    user: meeting.owner,
                });
            }

            meeting.priority = meeting.attendance.length;
        }

        meeting.title = title || meeting.title;
        meeting.status = ["draft", "planned", "confirmed", "started", "ended"]
            .includes(status) ? status : meeting.status;

        meeting.location = location || meeting.location;
        meeting.plannedStartTime = plannedStartTime || meeting.plannedStartTime;
        meeting.plannedEndTime = plannedEndTime || meeting.plannedEndTime;
        meeting.language = language || meeting.language;

        meeting.save();

        res.json({
            _id: meeting._id,
            title: meeting.title,
            priority: meeting.priority,
        });
    })
    .delete("/:id", async (req: IMeetingRequest, res) => {
        await req.meeting.remove();
        res.end();
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
        if (user) { return next(); }

        res.status(404)
            .json({
                message: "User not found",
            });
    })
    .get("/:id/attendance/:userId", async (req: IMeetingRequest, res) => {
        res.json(req.meeting.attendance.find((itme) => itme.user === req.params.userId));
    })
    .post("/:id/attendance/:userId", async (req: IMeetingRequest, res) => {
        const selected = req.meeting.attendance.find((item) => item.user === req.params.userId);
        if (!selected.status && selected.status !== "attended") {
            selected.arrivalTime = new Date();
            selected.status = "attended";

            await meetingModel.findByIdAndUpdate(
                req.meeting.id,
                {
                    attendance: req.meeting.attendance,
                },
            );
        }

        res.json(selected);
    });

router
    .get("/:id/trained-model", async (req: IMeetingRequest, res) => {
        const file = path.join(process.cwd(), "data/trained-model", req.params.id + ".clf");
        res.download(file);
    });

export const meetingRouter = router;
