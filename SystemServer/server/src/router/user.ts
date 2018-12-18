import { Request, Router } from "express";
import { DocumentQuery } from "mongoose";
import { Friend, userModel } from "../model/user";

const router = Router();

function sortCursorByReq(
    cursor: DocumentQuery<Array<InstanceType<any>>, InstanceType<any>>,
    req: Request,
) {
    const value = req.body.sortOrder === "desc" ? -1 : 1;
    const field = req.body.sortField;
    return field != null ? cursor.sort({ field: value }) : cursor;
}

function cursorPaginationByReq(
    cursor: DocumentQuery<Array<InstanceType<any>>, InstanceType<any>>,
    req: Request,
) {
    const { resultPageSize, resultPageNum } = req.query;
    if (resultPageSize) {
        return cursor
            .skip(resultPageSize * (resultPageNum - 1))
            .limit(resultPageSize);
    }
    return cursor;
}

router.get("/", async (req, res) => {

    let cursor = userModel.find();
    const length = await cursor.countDocuments().exec();

    const { resultPageNum = 1 } = req.query;

    cursor = sortCursorByReq(cursor, req);
    cursor = cursorPaginationByReq(cursor, req);

    const list = await cursor.find().exec();
    const items = list.map((item) => ({
        id: item._id,
        username: item.username,
    }));

    res.json({
        items,
        resultPageNum,
        length,
    });
});

router
    .get("/:usernames", async (req, res) => {
        const usernames = req.params.usernames.split(";");
        const query = {
            username: {
                $in: usernames,
            },
        };

        const { resultPageNum = 1 } = req.query;

        let cursor = userModel.find(query);
        const length = await cursor.countDocuments().exec();

        cursor = sortCursorByReq(cursor, req);
        cursor = cursorPaginationByReq(cursor, req);

        const list = await cursor.find().exec();

        const items = list.map((user) => ({
            id: user._id,
            username: user.username,
            displayName: user.displayName,
            email: user.email,
            friends: user.friends,
            userMeetingRelation: user.userMeetingRelation,
        }));

        res.json({
            items,
            resultPageNum,
            length,
        });
    })
    .use("/:username", async (req, res, next) => {
        const user = await userModel.findByUsername(req.params.username);
        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        next();
    })
    .put("/:username", async (req, res) => {
        const user = await userModel.findByUsername(req.params.username);
        const { password, displayName, email, friends } = req.body;

        if (password) {
            user.password = userModel.encryptPassword(password, user.salt);
        }

        if (friends) {
            user.friends = (await Promise.all(
                (friends as any[]).map(
                    async (friend) =>
                        new Friend(
                            await userModel.findByUsername(friend.name),
                            new Date(friend.addDate),
                            friend.started,
                        ),
                ),
            )).filter((friend) => friend.friend);
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
