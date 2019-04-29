from multiprocessing import Process, JoinableQueue, Queue
from sklearn.neighbors import KNeighborsClassifier
from face_recognition import face_locations, face_encodings


class PredictPorcss(Process):
    def __init__(
        self,
        task_queue: JoinableQueue,
        result_queue: Queue,
        knn_clf: KNeighborsClassifier = None,
        distance_threshold: int = 0.6,
    ):
        Process.__init__(self)
        self.task_queue = task_queue
        self.result_queue = result_queue
        self.knn_clf = knn_clf
        self.distance_threshold = distance_threshold

    def run(self):
        while True:
            next_frame = self.task_queue.get()
            if next_frame is None:
                self.task_queue.task_done()
                break
            result = self.predict(next_frame)
            self.result_queue.put(result)
            self.task_queue.task_done()

    def predict(self, frame):
        locations = face_locations(frame)

        if not locations:
            return []

        encodings = face_encodings(frame, locations)

        closest_distances = self.knn_clf.kneighbors(encodings, n_neighbors=1)
        are_matches = [
            closest_distances[0][i][0] <= self.distance_threshold
            for i in range(len(locations))
        ]

        return [
            (pred, loc) if rec else ("unknown", loc)
            for pred, loc, rec in zip(
                self.knn_clf.predict(encodings), locations, are_matches
            )
        ]
