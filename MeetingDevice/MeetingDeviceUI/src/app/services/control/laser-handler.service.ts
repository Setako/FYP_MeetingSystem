import {Injectable} from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class LaserHandlerService {

    public laserOrientationOffset;
    public listener;
    public lastReceive = 0;

    get display() {
        return new Date().getTime() <= this.lastReceive + 1000;
    }

    constructor() {
    }

    public laserMove(orientationOffset) {
        this.lastReceive = new Date().getTime();
        this.laserOrientationOffset = orientationOffset;
        if (orientationOffset[0] < -180) {
            orientationOffset[0] = 360 - orientationOffset;
        }
        if (orientationOffset[0] > 180) {
            orientationOffset[0] = orientationOffset[0] - 360;
        }
        // if (360 - orientationOffset[0]) {
        console.log(orientationOffset);
        // }
        this.listener();
    }

    public get laserPosition(): number[] {
        if (this.laserOrientationOffset == null) {
            return [0, 0];
        }
        return [
            Math.max(0, Math.min(100, 100 * ((this.laserOrientationOffset[0] + 60) / 120))),
            Math.max(0, Math.min(100, 100 * ((this.laserOrientationOffset[1] + 30) / 60)))];
    }

    public setListener(listener: () => void) {
        this.listener = listener;
    }

    public handle(data) {
        switch (data.type) {
            case 'laserOffset':
                this.laserMove(data.data);
                break;
        }
    }
}
