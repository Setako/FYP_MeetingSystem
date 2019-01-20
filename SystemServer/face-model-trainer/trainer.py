import math
from pathlib import Path
import pickle

import click
from sklearn import neighbors
import face_recognition as fr

DEFAULT_SETTING = {
    'server_root': './',
    'resource_root': 'data',
    'model_save_path': 'trained-model',
    'user_image_path': 'user-image'
}

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}


@click.command()
@click.argument('meeting_id')
@click.argument('user_id_list', nargs=-1, required=True)
@click.option(
    '--server-root',
    help='The root path of the server',
    type=click.Path(exists=True, file_okay=False, resolve_path=True)
)
@click.option(
    '--resource-root',
    help='The root path of the resource',
    type=click.Path(exists=True, file_okay=False, resolve_path=True)
)
@click.option(
    '--model-save-path',
    help='The directory where the model will be stored',
    type=click.Path(exists=True, file_okay=False, resolve_path=True)
)
@click.option(
    '--user-image-path',
    help='The directory with user image subdirectory',
    type=click.Path(exists=True, file_okay=False, resolve_path=True)
)
def command(
    meeting_id: str = None,
    user_id_list: tuple = tuple(),
    server_root: str = None,
    resource_root: str = None,
    model_save_path: str = None,
    user_image_path: str = None
):
    click.echo('Start training for meeting({})'.format(meeting_id))
    click.echo('-' * 55)

    if server_root is None:
        server_root = Path(DEFAULT_SETTING.get('server_root'))

    if resource_root is None:
        resource_root = server_root / DEFAULT_SETTING.get('resource_root')

    if model_save_path is None:
        model_save_path = Path(resource_root) / DEFAULT_SETTING.get(
            'model_save_path'
        ) / '{}.clf'.format(meeting_id)

    if user_image_path is None:
        user_image_path = Path(resource_root)
        user_image_path /= DEFAULT_SETTING.get('user_image_path')

    train_dir_list = []
    for id in user_id_list:

        path = user_image_path / id
        if not path.exists():
            click.echo(
                "Warning: User({}) folder not exist. Skip it by default...".
                format(path.name)
            )
            continue
        train_dir_list.append(str(path.resolve()))

    train(
        train_dir_list=train_dir_list,
        model_save_path=str(model_save_path),
        verbose=True
    )

def train(
    train_dir_list: list,
    model_save_path: str = None,
    n_neighbors: int = None,
    knn_algo: str = 'ball_tree',
    verbose: bool = False
):
    """
    Trains a k-nearest neighbors classifier for face recognition.
    :param train_dir_list: list of directory for each known person, with its id.
     (View in source code to see train_dir example tree structure)
     Structure:
        <train_dir_list>
        ├── <person1>/
        │   ├── <somename1>.jpg
        │   ├── <somename2>.jpg
        │   ├── ...
        ├── <person2>/
        │   ├── <somename1>.jpg
        │   └── <somename2>.jpg
        └── ...
    :param model_save_path: (optional) path to save model on disk
    :param n_neighbors: (optional) number of neighbors to weigh in classification. Chosen automatically if not specified
    :param knn_algo: (optional) underlying data structure to support knn.default is ball_tree
    :param verbose: verbosity of training
    :return: returns knn classifier that was trained on the given data.
    """
    x = []
    y = []

    # Loop through each person in the training set
    for index, class_dir in enumerate(train_dir_list, 1):

        class_dir = Path(class_dir)

        if not class_dir.is_dir():
            continue

        if verbose:
            click.echo(
                'Progress: {}/{} User({})'.format(
                    index, len(train_dir_list), class_dir.name
                )
            )

        # Loop through each training image for the current person
        for image_file in class_dir.iterdir():
            if not image_file.is_file():
                continue
            if image_file.suffix[1:] not in ALLOWED_EXTENSIONS:
                continue

            image = fr.load_image_file(str(image_file))
            face_bounding_boxes = fr.face_locations(
                image, number_of_times_to_upsample=2
            )

            if len(face_bounding_boxes) != 1:
                # If there are no people (or too many people) in a training image, skip the image.
                if verbose:
                    click.echo(
                        "Warning: Image {} not suitable for training: {}".
                        format(
                            image_file, "Didn't find a face"
                            if len(face_bounding_boxes) < 1 else
                            "Found more than one face"
                        )
                    )
            else:
                # Add face encoding for current image to the training set
                x.append(
                    fr.face_encodings(
                        image,
                        known_face_locations=face_bounding_boxes,
                        num_jitters=50 # change it small will faster
                    )[0]
                )
                y.append(class_dir.name)

    # Determine how many neighbors to use for weighting in the KNN classifier
    if n_neighbors is None:
        n_neighbors = int(round(math.sqrt(len(x))))
        if verbose:
            click.echo(
                'Choose n_neighbors automatically: {}'.format(n_neighbors)
            )

    # Create and train the KNN classifier
    knn_clf = neighbors.KNeighborsClassifier(
        n_neighbors=n_neighbors, algorithm=knn_algo, weights='distance'
    )
    knn_clf.fit(x, y)

    if model_save_path is not None:
        with open(model_save_path, 'wb') as model_file:
            pickle.dump(knn_clf, model_file)
        if verbose:
            click.echo('Model saved in {}'.format(model_save_path))

    return knn_clf


if __name__ == '__main__':
    command()
    