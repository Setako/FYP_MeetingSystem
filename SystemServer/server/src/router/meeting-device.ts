import { Request, Router } from "express";
import { InstanceType } from "typegoose";
import { MeetingDevice, meetingDeviceModel } from "../model/meeting-device";

const router = Router();

declare interface IMeetingDeviceRequest extends Request {
    device: InstanceType<MeetingDevice>;
}

router.get("/", async (req, res) => {
    const list = await meetingDeviceModel.find();
    const result = list.map((item) => ({
        _id: item._id,
    }));

    res.json(result);
});

router.post("/", async (req, res) => {
    const device = await new meetingDeviceModel(req.body).save();
    res.json({
        _id: device._id,
    });
});

router.use("/:id", async (req: IMeetingDeviceRequest, res, next) => {
    try {
        const device = await meetingDeviceModel.findById(req.params.id);
        req.device = device!;
        next();
    } catch (err) {
        res.sendStatus(404);
    }
});

router.get("/:id", async (req: IMeetingDeviceRequest, res, next) => {
    const result = req.device.toObject();
    delete result.seceret;
    res.json(result);
});

router.post("/:id", async (req: IMeetingDeviceRequest, res, next) => {
    await req.device.set(req.body).save();
});

router.delete("/:id", async (req: IMeetingDeviceRequest, res, next) => {
    await req.device.remove();
});

export const meetingDeviceRouter = router;
