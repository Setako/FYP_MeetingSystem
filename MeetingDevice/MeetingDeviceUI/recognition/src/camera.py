from multiprocessing import Process, JoinableQueue, Queue
import cv2
import rx
import rx.operators as op


class CameraPorcss(Process):
    def __init__(
        self,
        task_queue: JoinableQueue,
        result_queue: Queue,
        scaled_size=0.25,
        showImage=True,
    ):
        Process.__init__(self)
        self.task_queue = JoinableQueue
        self.result_queue = result_queue
        self.showImage = showImage
        self.scaled_size = scaled_size

    def run(self):
        video_capture = cv2.VideoCapture(0)
        while True:
            _, frame = video_capture.read()
            small_frame = cv2.resize(
                frame, (0, 0), fx=self.scaled_size, fy=self.scaled_size
            )
            rgb_small_frame = small_frame[:, :, ::-1]

            self.result_queue.put(rgb_small_frame)

            if self.showImage:
                cv2.imshow("Video", frame)

                if cv2.waitKey(1) & 0xFF == ord("q"):
                    break

        video_capture.release()
        cv2.destroyAllWindows()


if __name__ == "__main__":
    tasks = JoinableQueue()
    results = Queue()

    worker = CameraPorcss(tasks, results, showImage=True)
    worker.start()
