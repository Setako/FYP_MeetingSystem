import pickle
import time
from multiprocessing import Manager, Process

import click
import cv2
import socketio
from face_recognition import face_encodings, face_locations
import sys


def predict(Global, result_list, sio, distance_threshold=0.6):
    video_capture = cv2.VideoCapture(0)
    process_this_frame = True
    result = []
    while Global.is_exist:
        while not Global.model:
            sio.sleep(1)

        model = Global.model
        show_image = Global.show_image

        ret, frame = video_capture.read()
        small_frame = cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)
        rgb_small_frame = small_frame[:, :, ::-1]

        if process_this_frame:
            locations = face_locations(rgb_small_frame)
            if locations:
                encodings = face_encodings(rgb_small_frame, locations)
                closest_distances = model.kneighbors(encodings, n_neighbors=1)
                are_matches = [
                    closest_distances[0][i][0] <= distance_threshold
                    for i in range(len(locations))
                ]
                result = [
                    (pred, loc) if rec else ("unknown", loc)
                    for pred, loc, rec in zip(
                        model.predict(encodings), locations, are_matches
                    )
                ]
                for pred, loc in result:
                    result_list.append(pred)
            else:
                result = []

        process_this_frame = not process_this_frame

        if show_image:
            for pred, (top, right, bottom, left) in result:
                top *= 4
                right *= 4
                bottom *= 4
                left *= 4
                cv2.rectangle(frame, (left, top), (right, bottom), (0, 0, 255), 2)
                cv2.rectangle(
                    frame, (left, bottom - 35), (right, bottom), (0, 0, 255), cv2.FILLED
                )
                font = cv2.FONT_HERSHEY_DUPLEX
                cv2.putText(
                    frame, pred, (left + 6, bottom - 6), font, 1.0, (255, 255, 255), 1
                )
            cv2.imshow("Video", frame)

            if cv2.waitKey(1) & 0xFF == ord("q"):
                Global.show_image = False
                cv2.destroyAllWindows()

    video_capture.release()
    cv2.destroyAllWindows()


def handle_result(Global, result_list, sio):
    result_set = set()
    while Global.is_exist:
        while not result_list:
            sio.sleep(1)

        if not Global.model:
            result_list[:] = []
            result_set.clear()
            continue

        result_set.update(set(result_list))
        result_list[:] = []

        result_set.discard("unknown")
        if result_set:
            print("recognised user: {}".format(result_set))
            sio.emit("recognised-user", {"userIdList": list(result_set)})
        result_set.clear()


def setup_event(Global, result_list, sio):
    @sio.on("connect")
    def on_connect():
        clear_state(Global, result_list)
        print("connected")
        sio.emit("recognition-online", {"recognitionToken": Global.recognition_token})

    @sio.on("disconnect")
    def on_disconnect():
        clear_state(Global, result_list)
        print("disconnected")

    @sio.on("exception")
    def on_exception(data):
        print("exception:", data)

    @sio.on("recognition-online-success")
    def on_recognition_online_success(data):
        print("recognition online success")

    @sio.on("start-recognition")
    def on_start_recognition(data):
        clear_state(Global, result_list)
        print("start-recognition")
        if not data["trainedModel"]:
            sio.emit(
                "recognition-exception",
                {
                    "action": "start-recognition",
                    "message": "missing trained face model",
                },
            )
            return

        Global.model = pickle.loads(data["trainedModel"])
        Global.show_image = data["showImage"] is True

    @sio.on("end-recognition")
    def on_end_recognition():
        clear_state(Global, result_list)


def clear_state(Global, result_list):
    Global.is_exist = True
    Global.show_image = False
    Global.model = None
    result_list[:] = []


@click.command()
@click.option(
    "-t",
    "--token",
    help="token that used to connect to web scoket server",
    required=True,
    type=str,
)
@click.option(
    "-p",
    "--port",
    help="port of local web socket server, default as 3000",
    default=3000,
    type=int,
)
def start(token, port):
    # local setting
    Global = Manager().Namespace()
    Global.is_exist = True
    Global.show_image = False
    Global.model = None
    result_list = Manager().list()

    # socket setting
    Global.recognition_token = token
    socket_url = "http://localhost:{}".format(port)

    sio = socketio.Client()
    setup_event(Global, result_list, sio)

    predict_process = sio.start_background_task(predict, Global, result_list, sio)
    reuslt_process = sio.start_background_task(handle_result, Global, result_list, sio)

    sio.connect(socket_url, transports=["websocket", "polling"])
    sio.wait()


if __name__ == "__main__":
    start()
