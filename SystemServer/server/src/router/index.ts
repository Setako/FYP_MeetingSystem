import { Router } from "express";
import { meetingRouter } from "./meeting";
import { meetingDeviceRouter } from "./meeting-device";
import { userRouter } from "./user";

const router = Router();

router.use("/user", userRouter);
router.use("/meeting", meetingRouter);
router.use("/meeting-device", meetingDeviceRouter);

export const apiRouter = router;
