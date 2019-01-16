import {IPCService} from '../common/ipc.service';
import {ControlMode} from '../../shared/enum/control/control-mode';
import {Subject} from 'rxjs';
import {Injectable} from '@angular/core';

declare let electron: any;

declare interface ChangeModeMessage {
  mode: string;
}

@Injectable({
  providedIn: 'root'
})
export class ControlModeService {
  private _currentMode: Subject<ControlMode> = new Subject();

  constructor(private ipcServer: IPCService) {
  }

  changeMode(changeModeMessage: ChangeModeMessage) {
    const mode: ControlMode = ControlMode[changeModeMessage.mode];
    this._currentMode.next(mode);
  }

  get currentMode(): Subject<ControlMode> {
    return this._currentMode;
  }
}
