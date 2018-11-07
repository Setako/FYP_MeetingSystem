import { Router } from "express";
import { userModel } from "../model/user";

const router = Router();

router.get("/", async (req, res) => {
    const list = await userModel.find();
    const result = list.map((item) => ({
        _id: item._id,
        username: item.username,
    }));

    res.json(result);
});

router
    .use("/:username", async (req, res, next) => {
        const user = await userModel.findByUsername(req.params.username);
        if (!user) {
            return res.status(404)
                .json({
                    error: "No user found",
                });
        }

        next();
    })
    .get("/:username", async (req, res) => {
        const user = await userModel.findByUsername(req.params.username);
        res.json({
            _id: user._id,
            username: user.username,
            displayName: user.displayName,
            email: user.email,
            friends: user.friends,
            recentMeetingUsers: user.recentMeetingUsers,
        });
    })
    .put("/:username", async (req, res) => {
        const user = await userModel.findByUsername(req.params.username);
        const {
            password,
            displayName,
            email,
            friends,
        } = req.body;

        if (password) {
            user.password = userModel.encryptPassword(password, user.salt);
        }

        if (friends) {
            user.friends = await Promise.all(
                (friends as string[])
                    .map((username) => userModel.findByUsername(username)),
            );
        }

        user.displayName = displayName || user.displayName;
        user.email = email || user.email;

        user.save();
        res.end();
    })
    .delete("/:username", async (req, res) => {
        const user = await userModel.findByUsername(req.params.username);
        await user.remove();
        res.end();
    });

export const userRouter = router;
