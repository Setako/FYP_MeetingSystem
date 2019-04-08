import { Injectable } from '@nestjs/common';
import {
    Storage,
    Bucket,
    UploadOptions,
    FileOptions,
    GetSignedUrlConfig,
    File,
} from '@google-cloud/storage';
import { defer } from 'rxjs';
import { mapTo, map } from 'rxjs/operators';

@Injectable()
export class GoogleCloudStorageService {
    private readonly projectId: string;
    private readonly clientEmail: string;
    private readonly privateKey: string;
    private readonly bucketName: string;

    private bucket: Bucket;

    constructor() {
        this.projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
        this.clientEmail = process.env.GOOGLE_CLOUD_CLIENT_EMAIL;
        this.privateKey = process.env.GOOGLE_CLOUD_PRIVATE_KEY;
        this.bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME;

        this.bucket = this.getStorage().bucket(this.bucketName);
    }

    private getStorage() {
        return new Storage({
            projectId: this.projectId,
            credentials: {
                client_email: this.clientEmail,
                private_key: this.privateKey,
            },
        });
    }

    public exist(name: string, options?: UploadOptions) {
        return defer(() => this.bucket.file(name, options).exists());
    }

    public upload(pathString: string, options?: UploadOptions) {
        return defer(() => this.bucket.upload(pathString, options));
    }

    public delete(name: string, options?: UploadOptions) {
        return defer(() => this.bucket.file(name, options).delete());
    }

    public getFileSignedLink({
        name,
        options,
        signCfg,
    }: {
        name: string;
        options?: FileOptions;
        signCfg: GetSignedUrlConfig;
    }) {
        return defer(() =>
            this.bucket.file(name, options).getSignedUrl(signCfg),
        );
    }

    public getFilePublicLink(file: File) {
        return defer(() => file.makePublic()).pipe(
            mapTo(`${file.bucket.name}/${file.name}`),
            map(path => `https://storage.googleapis.com/${path}`),
        );
    }
}
