import pickle
import time

import click
import cv2
import face_recognition as fr
import requests
from sklearn.neighbors import KNeighborsClassifier

DEFAULT_API_URL = 'http://localhost:3000/api'


class MeetingAPI:

    api_url: str
    meeting_id: str
    serect: str

    meeting: dict
    model: KNeighborsClassifier

    def __init__(self, api_url, meeting_id, secret):
        self.api_url = api_url
        self.meeting_id = meeting_id
        self.serect = secret

    def get_meeting_url(self) -> str:
        return self.api_url + '/meeting/' + self.meeting_id

    def get_model_url(self) -> str:
        return '{}/{}'.format(self.get_meeting_url(), 'trained-model')

    def get_meeting(self) -> dict:
        self.meeting = get_json(self.get_meeting_url())
        return self.meeting

    def get_attendees(self) -> list:
        if not self.meeting:
            self.get_meeting()
        return self.meeting.get('attendance')

    def get_absence_attendees(self) -> list:
        return list(
            filter(
                lambda x: x.get('status') != 'present', self.get_attendees()
            )
        )

    def get_model(self) -> KNeighborsClassifier:
        if not self.model:
            return self.download_model()
        return self.model

    def download_model(self) -> KNeighborsClassifier:
        result = requests.get(self.get_model_url())
        result.raise_for_status()
        self.model = pickle.loads(result.content)
        return self.model

    def mark_attendance(self, user: str):
        result = requests.post(self.get_meeting_url() + '/attendance/' + user)
        result.raise_for_status()
        attendance = self.get_attendees()
        for attendee in attendance:
            if attendee.get('user') == user:
                attendee['status'] = 'present'
                self.meeting['attendance'] = attendance
                break


def get_json(link: str) -> dict:
    result = requests.get(link)
    result.raise_for_status()
    return result.json()


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


def lookup_attendance(
    api: MeetingAPI, scaled_size: float = 0.25, show_image: bool = False
):
    video_capture = cv2.VideoCapture(0)

    while api.get_absence_attendees():

        _, frame = video_capture.read()
        small_frame = cv2.resize(frame, (0, 0), fx=scaled_size, fy=scaled_size)
        rgb_small_frame = small_frame[:, :, ::-1]

        predictions = predict(rgb_small_frame, api.get_model())

        for user, (top, right, bottom, left) in predictions:
            if show_image:
                top = int(top / scaled_size)
                right = int(right / scaled_size)
                bottom = int(bottom / scaled_size)
                left = int(left / scaled_size)

                user = api.get_attendees()

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

            if user in map(
                lambda x: x.get('user'), api.get_absence_attendees()
            ):
                api.mark_attendance(user)
                click.echo(user)

        if show_image:
            cv2.imshow('Video', frame)

            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    video_capture.release()
    cv2.destroyAllWindows()


@click.command()
@click.argument('meeting_id')
@click.option('-s', '--secret', help='Used to connect server')
@click.option('-u', '--api-url', default=DEFAULT_API_URL, help='API Url')
@click.option('-i', '--show-image', is_flag=True, help='Enables windows')
@click.option('-v', '--verbose', is_flag=True, help='Enables verbose mode')
def command(
    meeting_id: str, secret: str, api_url: str, show_image: bool, verbose: bool
):
    try:
        # Check Meeting
        if verbose:
            print('Checking info of meeting...')

        api = MeetingAPI(api_url, meeting_id, secret)
        api.get_meeting()

        # Download Model
        if verbose:
            print('Downloading trained model...')
        api.download_model()

        # Filter Suitable Attendees
        if verbose:
            print('Attendees List: ' + ', '.join(map(
                lambda x: '{}({})'.format(x.get('user'), x.get('status')),
                api.get_attendees()
            )))

        # Start lookup attendance
        lookup_attendance(api, show_image=show_image)

    except Exception as err:
        if verbose:
            click.echo('Error: {}'.format(err), err=True, nl=True)
        # exit(1)
        raise


if __name__ == '__main__':
    command(None, None, None, None)
