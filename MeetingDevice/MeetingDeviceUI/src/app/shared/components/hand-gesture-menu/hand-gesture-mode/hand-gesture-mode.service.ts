import {Injectable} from '@angular/core';
import {HandGestureMode} from './hand-gesture-mode';

@Injectable({
  providedIn: 'root'
})
export class HandGestureModeService {
  private _availableHandGestureModes: HandGestureMode[] = [];
  private _currentHandGestureMode: HandGestureMode;

  constructor() {

  }

  get availableHandGestureModes(): HandGestureMode[] {
    return this._availableHandGestureModes;
  }

  get currentHandGestureMode(): HandGestureMode {
    return this._currentHandGestureMode;
  }
}
