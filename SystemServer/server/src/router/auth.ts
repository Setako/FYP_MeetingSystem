import { Router } from "express";
import jwt from "jsonwebtoken";
import uuidv4 from "uuid/v4";
import { userModel } from "../model/user";

const router = Router();

router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const user = await userModel.findByUsername(username);

    if (!(user && user.checkPassword(password))) {
        return res.status(401).json({
            message: "Incorrect username or password",
        });
    }

    const playload = {
        _id: user._id,
        username: user.username,
        token: user.tokenVerificationCode,
    };

    return res.json({
        token: jwt.sign(playload, process.env.tokenSecret, {
            expiresIn: "7d",
        }),
    });
});

router.post("/register", async (req, res) => {
    const { username, password, email } = req.body;

    if (!(username && password && email)) {
        return res.status(400).json({
            message: "Some content is missing",
        });
    }

    if (!(password.length >= 8 && password.length <= 60)) {
        return res.status(400).json({
            message: "Invalid password length",
        });
    }

    if (await userModel.isUsernameExist(username)) {
        return res.status(400).json({
            message: "Username already exist",
        });
    }

    if (await userModel.isEmailExist(email)) {
        return res.status(400).json({
            message: "Email already exist",
        });
    }

    const salt = uuidv4();
    const tokenVerificationCode = uuidv4();
    try {
        const user = await new userModel({
            username,
            password: userModel.encryptPassword(password, salt),
            salt,
            tokenVerificationCode,
            email,
            displayName: username,
        });

        user.save();
        res.end();
    } catch (e) {
        console.log(e);
    }

});

export const authRouter = router;
