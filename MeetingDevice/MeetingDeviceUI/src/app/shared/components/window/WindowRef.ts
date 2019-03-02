export declare const WINDOW_DATA = 'windata';

export class WindowRef<T> {
  private _component: T;
  private _show: boolean;


  constructor(component: T) {
    this._component = component;
  }

  get show(): boolean {
    return this._show;
  }

  set show(value: boolean) {
    this._show = value;
  }

  get component(): T {
    return this._component;
  }

  set component(value: T) {
    this._component = value;
  }
}
