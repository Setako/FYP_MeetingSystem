import { Request, Router } from "express";
import { ObjectId } from "mongodb";
import path from "path";
import { InstanceType } from "typegoose";
import { Attendance, Meeting, meetingModel } from "../model/meeting";
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
        }));

        res.json(result);
    }).post("/", async (req, res) => {
        if (req.body.attendance) {
            req.body.attendance = (req.body.attendance as any[]).map((item) => {
                item.user = new ObjectId(item.user);
                return item;
            });
        }

        const meeting = await new meetingModel(req.body).save();
        res.json({
            _id: meeting._id,
        });
    });

router.use("/:id", async (req: IMeetingRequest, res, next) => {
    try {
        const meeting = await meetingModel.findById(req.params.id);
        if (meeting) {
            req.meeting = meeting;
            next();
        } else {
            throw new Error();
        }
    } catch (err) {
        res.status(404).json({
            error: "Meeting not found",
        });
    }
});

router
    .get("/:id", async (req: IMeetingRequest, res) => {
        res.json(req.meeting);
    })
    .post("/:id", async (req: IMeetingRequest, res) => {

        if (req.body.attendance) {
            const attendance = req.body.attendance as Attendance[];

            attendance.map((item) => {
                if (item.arrivalTime) {
                    item.arrivalTime = new Date(item.arrivalTime);
                }
                return item;
            });
        }

        await req.meeting.set(req.body).save();
        res.end();
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

router.use("/:id/attendance/:userId", async (req: IMeetingRequest, res, next) => {
    try {
        const user = await userModel.findById(req.params.userId);
        if (user) {
            next();
        } else {
            throw new Error();
        }
    } catch (err) {
        res.status(404).json({
            error: "User not found",
        });
    }
});

router
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
