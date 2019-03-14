import {Injectable} from '@angular/core';
import {ElectronService} from 'ngx-electron';

import * as robot from 'robotjs';

export type MouseKey = 'left' | 'right' | 'middle';
export type ToggleType = 'up' | 'down';

export enum NormalKeys {
    BACKSPACE = 'backspace',
    DELETE = 'delete',
    ENTER = 'enter',
    TAB = 'tab',
    ESCAPE = 'escape',
    SPACE = 'space',

    UP = 'up',
    DOWN = 'down',
    RIGHT = 'right',
    LEFT = 'left',

}

export enum ModifierKeys {
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

    keyDown(key: string | NormalKeys | ModifierKeys, modified: string | ModifierKeys | Array<string | ModifierKeys> = []) {
        this.robot.keyTap(key, modified);
    }

    moveMouse(x: number, y: number, isByPercent: boolean = true) {
        this.robot.moveMouse(
            isByPercent ? (window.innerWidth / 100) * x : x,
            isByPercent ? (window.innerHeight / 100) * y : y);
    }

    moveMouseSmooth(x: number, y: number, isByPercent: boolean = true) {
        this.robot.moveMouseSmooth(
            isByPercent ? (window.innerWidth / 100) * x : x,
            isByPercent ? (window.innerHeight / 100) * y : y);
    }

    mouseClick(button: MouseKey = 'left', double = false) {
        this.robot.mouseClick(button, double);
    }

    mouseToggle(down: string = 'down', button: MouseKey = 'left') {
        this.robot.mouseToggle(down, button);
    }

    dragMouse(x: number, y: number, isByPercent: boolean = true) {
        this.robot.dragMouse(
            isByPercent ? (window.innerWidth / 100) * x : x,
            isByPercent ? (window.innerHeight / 100) * y : y);
    }

    scrollMouse(x: number, y: number) {
        this.robot.scrollMouse(x, y);
    }

    setMouseDelay(delay: number) {
        this.robot.setMouseDelay(delay);
    }
}
