import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfig } from '../app-config';

declare var electron: any;

@Injectable({
    providedIn: 'root',
})
export class DeviceService {
    constructor(private http: HttpClient) {}

    get deviceId() {
        return electron.remote.getGlobal('device').id;
    }

    get deviceSecret() {
        return electron.remote.getGlobal('device').secret;
    }

    public getDeviceAccessToken(): Observable<DeviceAccessToken> {
        return this.http.put<DeviceAccessToken>(
            `${AppConfig.API_PATH}/device/${this.deviceId}/start-token`,
            { secret: this.deviceSecret },
        );
    }
}

export class DeviceAccessToken {
    token: string;
}
