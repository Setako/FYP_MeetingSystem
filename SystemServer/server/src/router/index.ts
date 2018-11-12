import { NextFunction, Request, Response, Router } from "express";
import expressJwt from "express-jwt";
import jwt from "jsonwebtoken";
import uuidv4 from "uuid/v4";
import { userModel } from "../model";
import { authRouter } from "./auth";
import { meetingRouter } from "./meeting";
import { meetingDeviceRouter } from "./meeting-device";
import { userRouter } from "./user";

const router = Router();

router.use("/auth", authRouter);

router
    .use(expressJwt({ secret: process.env.tokenSecret, credentialsRequired: false }))
    .use((err: any, req: Request, res: Response, next: NextFunction) => {
        if (err.name === "UnauthorizedError") {
            return res.status(401)
                .json({ message: "Token is expired or fake" });
        }

        return res.status(500).json({ message: err });
    })
    .use((req, res, next) => {
        if (!req.user) {
            return res.status(401)
                .json({ message: "No token received" });
        }

        return next();
    })
    .use(async (req, res, next) => {
        const user = await userModel.findByUsername(req.user.username);
        if (!!user && user.token === req.user.token) { return next(); }

        if (!user) {
            return res.status(401)
                .json({
                    message: "Owned token user may no longer exist",
                });
        }

        res.status(401)
            .json({
                message: "Token is expired or fake",
            });
    });

router
    .post("/auth/refresh", async (req, res) => {
        res.json({
            token: jwt.sign({
                _id: req.user._id,
                username: req.user.username,
            }, process.env.tokenSecret, { expiresIn: "7d" }),
        });
    })
    .post("/auth/logout", async (req, res) => {
        const user = await userModel.findByUsername(req.user.username);
        user.token = uuidv4();
        user.save();
        res.end();
    });

router.use("/user", userRouter);
router.use("/meeting", meetingRouter);
router.use("/meeting-device", meetingDeviceRouter);

export const apiRouter = router;
