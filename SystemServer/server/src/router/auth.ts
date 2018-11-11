import { Router } from "express";
import jwt from "jsonwebtoken";
import uuidv4 from "uuid/v4";
import { userModel } from "../model/user";

const router = Router();

router.post("/login", async (req, res) => {
    const { username, password, expiresIn } = req.body;
    const user = await userModel.findByUsername(username);

    if (!(user && user.checkPassword(password))) {
        return res.status(401)
            .json({
                error: "Incorrect username or password",
            });
    }

    const playload = {
        _id: user._id,
        username: user.username,
    };

    return res.json({
        token: jwt.sign(playload, process.env.tokenSecret, {
            expiresIn: expiresIn || "1d",
        }),
    });
});

router.post("/register", async (req, res) => {
    const {
        username,
        password,
        email,
        displayName,
    } = req.body;

    if (await userModel.isUsernameExist(username)) {
        return res.status(400)
            .json({
                error: "Username already exist",
            });
    }

    const salt = uuidv4();
    const user = await new userModel({
        username,
        password: userModel.encryptPassword(password, salt),
        salt,
        email,
        displayName: displayName || username,
    });

    user.save();
    res.end();
});

export const authRouter = router;
