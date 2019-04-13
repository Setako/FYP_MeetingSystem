import os
import sys
import pickle
import aiofiles
import socketio

from aiohttp import web
from dotenv import load_dotenv
from pathlib import Path
from collections import Counter

from utils.trainer import Trainer
from utils.storage import Storage
from utils.socket_error_checker import SockerErrorChecker

load_dotenv()

# Path
root: Path = Path(sys.argv[0]).absolute().parent
cache_img_root: Path = root / "cache" / "img"
cache_npy_root: Path = root / "cache" / "npy"
cache_clf_root: Path = root / "cache" / "clf"

# Socket
sio = socketio.AsyncServer(async_mode="aiohttp")
app = web.Application()
sio.attach(app)

# Utils
storage = Storage(
    client=Storage.make_client(
        project_id=os.getenv("GOOGLE_CLOUD_PROJECT_ID"),
        client_email=os.getenv("GOOGLE_CLOUD_CLIENT_EMAIL"),
        private_key=os.getenv("GOOGLE_CLOUD_PRIVATE_KEY"),
        token_uri=os.getenv("GOOGLE_CLOUD_TOKEN_URI")
    ),
    bucket=os.getenv("GOOGLE_CLOUD_DEFAULT_BUCKET"),
)
checker = SockerErrorChecker(sio)
trainer = Trainer(num_jitters=50)

# Gateway
@sio.on("connect")
def connect(sid, _environ):
    print("connect ", sid)


@sio.on("disconnect")
def disconnect(sid):
    print("disconnect ", sid)


@sio.on("auth")
async def auth(sid, data):
    print("auth ", sid)

    is_success = data["token"] == os.getenv("TOKEN")

    await sio.save_session(sid, {"auth": is_success})
    await sio.emit("auth_result", dict(success=is_success), room=sid)


@sio.on("train")
async def train(sid, data):
    print("train ", sid)

    if not await checker.check_on_train(sid, data):
        return

    response = dict(data)

    data_id: str = data["id"]

    user_id: str = data["owner"]
    image_name: str = data["name"]
    image_path: str = data["imagePath"]

    image_save_path: Path = cache_img_root / "{}-{}".format(user_id, image_name)

    if not storage.file_exists(image_path):
        await checker.emit_exception(sid, "train", "imagePath does not exist")
        return

    storage.download_to_file_path(image_path, image_save_path)

    result = trainer.train(image_save_path)
    result_save_path: Path = cache_npy_root / "{}.npy".format(image_name)

    cloud_save_path = image_path.split("/")
    cloud_save_path[-1] = result_save_path.name
    cloud_save_path = "/".join(cloud_save_path)

    if result is None:
        response.update(dict(valid=False))
        await sio.emit("train_result", response, sid)
        return

    async with aiofiles.open(result_save_path, "wb") as f:
        await f.write(pickle.dumps(result))

    with open(result_save_path, "rb") as f:
        storage.upload_from_file(f, cloud_save_path)

    image_save_path.unlink()
    result_save_path.unlink()

    response.update(dict(valid=True, resultPath=cloud_save_path))
    await sio.emit("train_result", response, sid)

    print('train-finish {}'.format(sid))


@sio.on("merge")
async def train(sid, data):
    """
    data: {
        id: str,
        items: [
            {
                owner: str,
                name: str,
                resultPath: str,
            }
        ]
    }
    """
    print("merge ", sid)

    if not await checker.check_on_merge(sid, data):
        return

    merge_id: str = data["id"]
    items: list = data["items"]

    X = []
    Y = []

    for item in items:
        item: dict
        item_save_path: Path = cache_npy_root / "{}.npy".format(item.get("name"))

        if not storage.file_exists(item.get("resultPath")):
            continue

        storage.download_to_file_path(item.get("resultPath"), item_save_path)

        async with aiofiles.open(item_save_path, "rb") as f:
            npy = pickle.loads(await f.read())

        X.append(npy)
        Y.append(item.get("owner"))

        item_save_path.unlink()

    knn_clf = trainer.make_knn_classifier_from_xy(X, Y)

    knn_clf_save_path: Path = cache_clf_root / "{}.clf".format(merge_id)
    cloud_save_path = "models/{}.clf".format(merge_id)

    async with aiofiles.open(knn_clf_save_path, "wb") as f:
        await f.write(pickle.dumps(knn_clf))

    with open(knn_clf_save_path, "rb") as f:
        storage.upload_from_file(f, cloud_save_path)

    knn_clf_save_path.unlink()

    valid_owner = dict(Counter(Y))

    response = dict(data)
    response.update(dict(modelPath=cloud_save_path, validOwner=valid_owner))

    await sio.emit("merge_result", response, sid)
    print('merge-finish {}'.format(sid))


if __name__ == "__main__":
    cache_npy_root.mkdir(parents=True, exist_ok=True)
    cache_img_root.mkdir(parents=True, exist_ok=True)
    cache_clf_root.mkdir(parents=True, exist_ok=True)

    web.run_app(app, port=int(os.getenv('PORT', 8080)))
