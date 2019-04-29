import face_recognition as fr

from math import sqrt
from pathlib import Path
from sklearn import neighbors


class Trainer:
    def __init__(
        self,
        knn_neighbors: int = None,
        knn_algo: str = "ball_tree",
        knn_weights: str = "distance",
        number_of_times_to_upsample: int = 1,
        num_jitters: int = 50,
    ):
        self.knn_neighbors = knn_neighbors
        self.knn_algo = knn_algo
        self.knn_weights = knn_weights

        self.number_of_times_to_upsample = number_of_times_to_upsample
        self.num_jitters = num_jitters

    def train(self, image):
        if type(image) == str:
            image = Path(image)

            if not image.is_file:
                return False

        image = fr.load_image_file(image)

        bouding_boxes = fr.face_locations(image, self.number_of_times_to_upsample)

        if len(bouding_boxes) != 1:
            return None

        return fr.face_encodings(
            face_image=image,
            known_face_locations=bouding_boxes,
            num_jitters=self.num_jitters,
        )[0]

    def make_knn_classifier_from_xy(self, x, y) -> neighbors.KNeighborsClassifier:
        n_neighbors = (
            self.knn_neighbors
            if not self.knn_neighbors is None
            else int(round(sqrt(len(x))))
        )

        knn_clf = neighbors.KNeighborsClassifier(
            n_neighbors=n_neighbors, algorithm=self.knn_algo, weights=self.knn_weights
        )
        knn_clf.fit(x, y)

        return knn_clf

    def make_knn_classifier_info_from_xy(self, x, y):
        n_neighbors = (
            self.knn_neighbors
            if not self.knn_neighbors is None
            else int(round(sqrt(len(x))))
        )

        return {
            "n_neighbors": n_neighbors,
            "algorithm": self.knn_algo,
            "weights": self.knn_weights,
            "x": x,
            "y": y,
        }

