import { Router } from "express";
import {authRouter} from "./auth";
import { meetingRouter } from "./meeting";
import { meetingDeviceRouter } from "./meeting-device";
import { identifierMiddleware } from "./middleware/auth-identifier";
import { userRouter } from "./user";

const router = Router();

// login

// check
// router.use("/auth", authRouter);

// router.use(identifierMiddleware);
router.use("/user", userRouter);
router.use("/meeting", meetingRouter);
router.use("/meeting-device", meetingDeviceRouter);

export const apiRouter = router;
