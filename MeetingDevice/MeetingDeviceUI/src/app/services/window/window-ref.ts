import { ComponentRef } from '@angular/core';
import { WindowComponent } from '../../shared/components/window/window.component';

export const WINDOW_DATA = 'windata';

export class WindowRef<T> {
    readonly componentRef: ComponentRef<WindowComponent<T>>;

    constructor(componentRef: ComponentRef<WindowComponent<T>>) {
        this.componentRef = componentRef;
    }

    placeBehind() {
        // @ts-ignore
        this.componentRef.instance.zIndex = 5;
    }

    placeTop() {
        // @ts-ignore
        this.componentRef.instance.zIndex = 10;
    }

    close() {
        this.componentRef.destroy();
    }
}
