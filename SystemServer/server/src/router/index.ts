import { Router } from "express";
import expressJwt from "express-jwt";
import { authRouter } from "./auth";
import { meetingRouter } from "./meeting";
import { meetingDeviceRouter } from "./meeting-device";
import { userRouter } from "./user";

const router = Router();

router.use("/auth", authRouter);

router
    .use(expressJwt({ secret: process.env.tokenSecret, credentialsRequired: false }))
    .use((req, res, next) => {
        if (!!req.user) { return next(); }

        res.status(401)
            .json({
                error: req.headers.authorization
                    ? "Token is expired or fake"
                    : "No token received",
            });
    });

router.use("/user", userRouter);
router.use("/meeting", meetingRouter);
router.use("/meeting-device", meetingDeviceRouter);

export const apiRouter = router;
