import {Injectable} from '@angular/core';
import {IPCService} from '../common/ipc.service';
import {GestureActionHandlerService} from './gesture-action-handler.service';
import {ResourceOpenerService} from './resource-opener.service';
import {MatSnackBar} from '@angular/material';
import {LaserHandlerService} from '../control/laser-handler.service';

@Injectable({
    providedIn: 'root'
})
export class ActionReceiverService {

    constructor(private ipc: IPCService,
                private gestureActionHandler: GestureActionHandlerService,
                private resourceOpener: ResourceOpenerService,
                private laserHandler: LaserHandlerService,
                private snackBar: MatSnackBar) {
        ipc.on('send-action', (event, data: any) => {
            switch (data.type) {
                case 'gesture':
                    this.handleGesture(data.data);
                    break;
                case 'laser':
                    this.laserHandler.handle(data.data);
                    break;
                case 'open-resource':
                    this.handleOpenResource(data.data);
                    break;
                default:
                    snackBar.open('Unknown action received', 'DISMISS', {duration: 4000});
                    console.log('unkown action');
                    console.log(data);
            }
        });
    }

    handleGesture(data: any) {
        this.gestureActionHandler.onGesture(data);
    }

    handleOpenResource(data: any) {
        this.resourceOpener.open(data.type, data.url);
    }
}
