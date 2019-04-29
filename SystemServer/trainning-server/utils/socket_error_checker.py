from socketio import AsyncServer


class SockerErrorChecker:
    def __init__(self, sio: AsyncServer):
        self.sio = sio

    async def emit_exception(self, sid: str, action: str, message: str):
        await self.sio.emit("exception", dict(action=action, message=message), sid)

    async def check_data_include_required(
        self, sid: str, data, required: list, action: str = "unknown"
    ) -> bool:
        error = False
        if not data or type(data) != dict:
            error = True

        data: dict

        for item in required:
            if error or not data.get(item):
                error = True
                break

        if error:
            await self.emit_exception(
                sid, action, "please emit data including {}".format(", ".join(required))
            )
            return False
        return True

    async def check_is_auth(self, sid: str, data, action: str = "unknown") -> bool:
        async with self.sio.session(sid) as session:
            if not session["auth"]:
                await self.emit_exception(
                    sid,
                    action,
                    "please first emit <auth> to the server with the correct token",
                )
                return False
        return True

    async def check_on_train(self, sid: str, data) -> bool:
        action = "train"

        if not await self.check_is_auth(sid, data, action):
            return False

        required = ["id", "owner", "name", "imagePath"]
        if not await self.check_data_include_required(sid, data, required, action):
            return False

        return True

    async def check_on_merge(self, sid: str, data) -> bool:
        action = "merge"

        if not await self.check_is_auth(sid, data, action):
            return False

        required = ["id", "items"]
        if not await self.check_data_include_required(sid, data, required, action):
            return False

        if type(data["id"]) != str or type(data["items"]) != list:
            await self.emit_exception(
                sid, action, "id must be str and items must be list"
            )

        error = False
        for item in data["items"]:
            if type(item) != dict:
                error = True
                break

            item: dict
            if (
                not item.get("owner", False)
                or not item.get("resultPath", False)
                or not item.get("name", False)
            ):
                error = True
                break

        if error:
            await self.emit_exception(
                sid, action, "items must list of items like {owner, resultPath}"
            )
            return False

        return True

