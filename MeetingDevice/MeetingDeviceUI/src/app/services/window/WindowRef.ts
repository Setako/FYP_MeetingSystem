import { ComponentRef } from '@angular/core';

export const WINDOW_DATA = 'windata';

export class WindowRef<T> {
    readonly componentRef: ComponentRef<T>;

    constructor(componentRef: ComponentRef<T>) {
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
