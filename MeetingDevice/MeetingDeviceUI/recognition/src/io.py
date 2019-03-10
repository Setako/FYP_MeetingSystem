import socketio
import asyncio
import cv2
from src.predict import PredictPorcss
from src.camera import CameraPorcss
import rx
from rx import operators as op, concurrency as scheduler
import multiprocessing
import pickle
from multiprocessing import JoinableQueue, Queue
from rx.concurrency.mainloopscheduler import AsyncIOScheduler

env = {}

from_frame_stream_subscriber = None
from_predict_stream_subscriber = None

predictor: PredictPorcss = None
camera: CameraPorcss = None


def clean():
    global from_frame_stream_subscriber, from_predict_stream_subscriber, predictor, camera

    if from_frame_stream_subscriber:
        from_frame_stream_subscriber.dispose()
        from_frame_stream_subscriber = None

    if from_predict_stream_subscriber:
        from_predict_stream_subscriber.dispose()
        from_frame_stream_subscriber = None

    if predictor:
        predictor.kill()
        predictor = None


def setup_event(io: socketio.AsyncClient):
    @io.on("connect")
    def on_connect():
        print("connected")
        io.emit("recognition-online", {"recognitionToken": env["recognition_token"]})

    @io.on("disconnect")
    def on_disconnect():
        print("disconnected")
        clean()

    @io.on("exception")
    def on_exception(data):
        print("exception:", data)

    @io.on("recognition-online-success")
    def on_recognition_online_success(data):
        print("recognition online success")

    @io.on("start-recognition")
    def on_start_recognition(data):
        clean()
        print("start-recognition")
        if not data["trainedModel"]:
            io.emit(
                "recognition-exception",
                {
                    "action": "start-recognition",
                    "message": "missing trained face model",
                },
            )
            return

        global predictor
        result_queue = Queue()
        predictor = PredictPorcss(
            JoinableQueue(), result_queue, pickle.loads(data["trainedModel"])
        )
        predictor.start()

        def from_frame_stream(observer: rx.core.Observer, args=None):
            video_capture = cv2.VideoCapture(0)
            while True:
                _, frame = video_capture.read()
                small_frame = cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)
                rgb_small_frame = small_frame[:, :, ::-1]

                observer.on_next(rgb_small_frame)

                if data["showImage"]:
                    cv2.imshow("Video", frame)

                    if cv2.waitKey(1) & 0xFF == ord("q"):
                        break
            video_capture.release()
            cv2.destroyAllWindows()

        def from_predict_stream(observer: rx.core.Observer, args=None):
            while not observer.is_stopped:
                observer.on_next(result_queue.get())

        def emit_attendance(userList):
            print(userList)
            io.emit("recognised-user", {"userList": list(userList)})

        global from_frame_stream_subscriber, from_predict_stream_subscriber
        from_frame_stream_subscriber = (
            rx.create(from_frame_stream)
            .pipe(
                op.observe_on(scheduler.NewThreadScheduler()),
                op.subscribe_on(scheduler.NewThreadScheduler()),
            )
            .subscribe(lambda x: predictor.task_queue.put(x))
        )
        from_predict_stream_subscriber = (
            rx.create(from_predict_stream)
            .pipe(
                op.observe_on(scheduler.NewThreadScheduler()),
                op.subscribe_on(scheduler.NewThreadScheduler()),
                op.flat_map(rx.from_iterable),
                op.pluck(0),
                op.filter(lambda x: x != "unknown"),
                op.buffer_with_time(1),
                op.map(set),
                op.filter(lambda x: x),
            )
            .subscribe(emit_attendance)
        )

    @io.on("end-recognition")
    def on_end_recognition():
        clean()


def start(token: str, port: int):
    env["recognition_token"] = token
    env["io_url"] = "http://localhost:{}".format(port)

    io = socketio.Client()
    setup_event(io)

    io.connect(env["io_url"])
    io.wait()

