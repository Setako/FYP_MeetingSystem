import asyncio
from google.cloud import storage
from google.oauth2.service_account import Credentials


class Storage:
    def __init__(self, client: storage.Client, bucket: str):
        self.client = client
        self.bucket = client.get_bucket(bucket)

    @classmethod
    def make_client(
        cls, client_email: str, private_key: str, project_id: str, token_uri: str
    ) -> storage.Client:
        info = dict(
            client_email=client_email.replace(r"\n", ""),
            private_key=private_key.replace(r"\n", "\n"),
            project_id=project_id.replace(r"\n", ""),
            token_uri=token_uri.replace(r"\n", ""),
        )

        credentials = Credentials.from_service_account_info(info)

        return storage.Client(project=project_id, credentials=credentials)

    def file_exists(self, file_path: str):
        return self.bucket.blob(file_path).exists()

    def download_to_file_path(self, file_path: str, save_path: str):
        return self.bucket.blob(file_path).download_to_filename(save_path)

    def upload_from_file_path(self, file_path: str, cloud_path: str):
        return self.bucket.blob(cloud_path).upload_from_filename(file_path)

    def upload_from_file(self, file, cloud_path: str):
        return self.bucket.blob(cloud_path).upload_from_file(file)

