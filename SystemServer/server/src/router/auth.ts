import { Request, Router } from "express";
import { ObjectId } from "mongodb";
import { InstanceType } from "typegoose";
import { User, userModel } from "../model/user";

const router = Router();

// router.get("/", async (req, res) => {

//     res.json();
// });

export const authRouter = router;
