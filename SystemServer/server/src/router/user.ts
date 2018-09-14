import { Request, Router } from "express";
import { ObjectId } from "mongodb";
import { InstanceType } from "typegoose";
import { User, userModel } from "../model/user";

const router = Router();

declare interface IUserRequest extends Request {
    user: InstanceType<User>;
}

router.get("/", async (req, res) => {
    const list = await userModel.find();
    const result = list.map((item) => ({
        _id: item._id,
        username: item.username,
    }));

    res.json(result);
});

router.post("/", async (req, res) => {
    try {
        const user = await new userModel(req.body).save();
        res.json
        ({
            _id: user._id,
        });
    } catch (err) {
        res.sendStatus(400);
    }
});

router.use("/:id", async (req: IUserRequest, res, next) => {
    try {
        const user = await userModel.findById(req.params.id);
        if (user) {
            req.user = user;
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

router.get("/:id", async (req: IUserRequest, res) => {

    const result = req.user.toObject();
    delete result.passwowrd;

    res.json(result);
});

router.post(":/id", async (req: IUserRequest, res) => {
    await req.user.set(req.body).save();
    res.end();
});

router.delete("/:id", async (req: IUserRequest, res) => {
    await req.user.remove();
    res.end();
});

export const userRouter = router;
