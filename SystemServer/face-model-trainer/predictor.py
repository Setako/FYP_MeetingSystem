import pickle

import click
import cv2
from sklearn.neighbors import KNeighborsClassifier
import face_recognition as fr


sample_encoded = [([-1.02917440e-01,  1.27070889e-01,  3.49744665e-03, -7.63558969e-02,
        9.34620388e-03,  9.06301197e-03, -8.57094005e-02, -9.72007141e-02,
        1.86265051e-01, -9.45388377e-02,  2.55663216e-01,  8.97707641e-02,
       -2.11347803e-01, -1.41153559e-01,  2.60112379e-02,  1.19057149e-01,
       -1.88240960e-01, -8.42589065e-02, -1.07674949e-01, -1.25984251e-01,
        1.80701651e-02, -2.31014821e-03,  9.21404138e-02,  4.61079925e-02,
       -1.33806974e-01, -3.46539885e-01, -5.40795028e-02, -1.86529174e-01,
       -9.11216717e-03, -9.87671241e-02, -6.98685497e-02,  1.44524989e-03,
       -1.76391765e-01, -1.02945395e-01,  2.66387332e-02, -2.29875296e-02,
        9.08511505e-03,  2.11084485e-02,  1.95377782e-01,  3.21503766e-02,
       -1.03363492e-01,  8.94626677e-02,  3.04113720e-02,  2.40485415e-01,
        2.71009088e-01,  8.88406634e-02, -1.39867782e-03, -9.91901383e-02,
        1.19774967e-01, -2.33026579e-01,  7.71175176e-02,  1.58578515e-01,
        5.82685918e-02,  2.88057514e-02,  9.09098387e-02, -1.77859813e-01,
        1.14971050e-03,  8.85628611e-02, -1.43994778e-01,  3.08307372e-02,
        2.02647187e-02, -6.68702722e-02, -7.63242394e-02,  3.33452299e-02,
        2.06708252e-01,  1.18990965e-01, -1.30895898e-01, -5.59403747e-02,
        1.43909365e-01, -3.12848054e-02,  1.40834050e-02,  1.21629136e-02,
       -1.87021956e-01, -2.05371246e-01, -2.26936504e-01,  9.12685171e-02,
        3.80802006e-01,  1.84901774e-01, -1.94197416e-01,  2.09358688e-02,
       -1.95599452e-01,  3.93908247e-02,  7.76003227e-02,  1.27188326e-03,
       -8.48706961e-02, -1.37234092e-01, -3.31185795e-02,  5.37084527e-02,
        9.05042663e-02,  4.60691266e-02, -4.48965207e-02,  2.20941722e-01,
       -2.15991661e-02,  4.99867983e-02,  2.44038198e-02,  6.80937245e-02,
       -1.49105892e-01, -3.15547884e-02, -1.82146966e-01, -6.29655644e-02,
        2.59072408e-02, -3.50769311e-02,  3.35311629e-02,  1.29865780e-01,
       -2.33485743e-01,  6.43621460e-02,  1.48562966e-02, -3.24696079e-02,
        3.63532640e-02,  7.33970255e-02, -3.29306126e-02, -4.83646579e-02,
        6.97697401e-02, -2.29757711e-01,  2.52860069e-01,  2.38277227e-01,
        5.21014184e-02,  1.74105331e-01,  8.41626227e-02,  1.70375742e-02,
       -9.09251347e-03, -2.93991417e-02, -1.68439314e-01, -6.65751323e-02,
        4.80576828e-02,  5.86545318e-02,  6.36997893e-02, -3.11428565e-04])]


def predict(
    frame, knn_clf: KNeighborsClassifier, distance_threshold: int = 0.6
):
    if frame is None:
        raise Exception("Must supply image")

    if knn_clf is None:
        raise Exception("Must supply knn classifier")

    face_locations = fr.face_locations(frame)

    if not face_locations:
        return []

    face_encodings = fr.face_encodings(frame, face_locations)

    closest_distances = knn_clf.kneighbors(face_encodings, n_neighbors=1)
    are_matches = [
        closest_distances[0][i][0] <= distance_threshold
        for i in range(len(face_locations))
    ]

    return [
        (pred, loc) if rec else ("unknown", loc) for pred, loc, rec in
        zip(knn_clf.predict(face_encodings), face_locations, are_matches)
    ]

def lookup(
    model: KNeighborsClassifier,
    display_window: bool = False,
    stop_when_done: bool = False,
    verbose: bool = False,
    scaled_size: float = 0.25
):
    total_predict_num = len(model.predict_proba(sample_encoded)[0])
    user_list = []

    video_capture = cv2.VideoCapture(0)
    while total_predict_num - len(user_list) or not stop_when_done:
        _, frame = video_capture.read()
        small_frame = cv2.resize(frame, (0, 0), fx=scaled_size, fy=scaled_size)
        rgb_small_frame = small_frame[:, :, ::-1]

        predictions = predict(rgb_small_frame, model)

        for user, (top, right, bottom, left) in predictions:
            if display_window:
                top = int(top / scaled_size)
                right = int(right / scaled_size)
                bottom = int(bottom / scaled_size)
                left = int(left / scaled_size)

                cv2.rectangle(
                    frame, (left, top), (right, bottom), (0, 0, 255), 2
                )

                cv2.rectangle(
                    frame, (left, bottom - 35), (right, bottom), (0, 0, 255),
                    cv2.FILLED
                )
                font = cv2.FONT_HERSHEY_DUPLEX
                cv2.putText(
                    frame, "{}".format(user), (left + 6, bottom - 6), font,
                    1.0, (255, 255, 255), 1
                )

            if verbose and user not in user_list:
                user_list.append(user)
                click.echo('Found {}'.format(user), color='red')
                click.echo('Remaining No.: {}'.format(total_predict_num - len(user_list)))

        if display_window:
            cv2.imshow('Video', frame)

            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    video_capture.release()
    cv2.destroyAllWindows()


@click.command()
@click.argument('meeting_id')
@click.option('-d', '--display-window', is_flag=True, help='Enables windows')
@click.option('-v', '--verbose', is_flag=True, help='Enables verbose mode')
@click.option(
    '-s',
    '--stop-when-done',
    is_flag=True,
    help='Stop predicting when everyone was investigated'
)
def command(
    meeting_id: str,
    display_window: bool = False,
    verbose: bool = False,
    stop_when_done: bool = False
):
    try:
        if verbose:
            click.echo('Loading trained model...')

        with open('./data/trained-model/{}.clf'.format(meeting_id),
                  'rb') as model_file:
            model = pickle.load(model_file)

        if verbose:
            click.echo("Starting predictor...")

        lookup(model, display_window, stop_when_done, verbose)

    except Exception as err:
        if verbose:
            click.echo('Error: {}'.format(err), err=True, nl=True)
        raise


if __name__ == '__main__':
    command(None)
