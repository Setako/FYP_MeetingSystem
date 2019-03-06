import { Injectable } from '@angular/core';
import { ElectronService } from 'ngx-electron';

import * as robot from 'robotjs';

export enum NormalKeys {
    BACKSPACE = 'backspace',
    DELETE = 'delete',
    ENTER = 'enter',
    TAB = 'tab',
    ESCAPE = 'escape',
    SPACE = 'escape',

    UP = 'up',
    DOWN = 'down',
    RIGHT = 'right',
    LEFT = 'left',

    ALT = 'alt',
    SHIFT = 'shift',
}

@Injectable({
    providedIn: 'root',
})
export class RobotService {
    robot: typeof robot;

    constructor(private readonly electronService: ElectronService) {
        this.robot = this.electronService.remote.require('robotjs');
    }

    get screen(): { width: number; height: number } {
        return this.robot.getScreenSize();
    }

    keyDown(key: string | NormalKeys, modified: string | string[] = []) {
        this.robot.keyTap(key, modified);
    }

    moveMouse(isByPercent: boolean, x: number, y: number) {
        if (isByPercent) {
            x = this.screen.width * (x / 100);
            y = this.screen.height * (y / 100);
        }

        this.robot.moveMouse(x, y);
    }

    moveMouseSmooth(isByPercent: boolean, x: number, y: number) {
        if (isByPercent) {
            x = this.screen.width * (x / 100);
            y = this.screen.height * (y / 100);
        }

        this.robot.moveMouseSmooth(x, y);
    }

    mouseClick(button: 'left' | 'right' | 'middle' = 'left', double = false) {
        this.robot.mouseClick(button, double);
    }

    scrollMouse(x: number, y: number) {
        this.robot.scrollMouse(x, y);
    }
}
