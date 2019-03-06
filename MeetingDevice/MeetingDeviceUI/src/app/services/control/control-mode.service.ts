import { IPCService } from '../common/ipc.service';
import { GestureActionType } from '../../shared/enum/control/gesture-action-type';
import { Subject } from 'rxjs';
import { Injectable } from '@angular/core';

declare let electron: any;

declare interface ChangeModeMessage {
    mode: string;
}

@Injectable({
    providedIn: 'root',
})
export class ControlModeService {
    private _currentMode: Subject<GestureActionType> = new Subject();

    constructor(private ipcServer: IPCService) {}

    changeMode(changeModeMessage: ChangeModeMessage) {
        const mode: GestureActionType = GestureActionType[changeModeMessage.mode];
        this._currentMode.next(mode);
    }

    get currentMode(): Subject<GestureActionType> {
        return this._currentMode;
    }
}
