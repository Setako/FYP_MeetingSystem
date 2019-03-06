import { Injectable } from '@angular/core';
import { IPCService } from '../common/ipc.service';
import { WindowStackService } from '../window/window-stack.service';
import { MatSnackBar } from '@angular/material';
import { TokenQrcodeWindowComponent } from '../../shared/components/window/token-qrcode-window/token-qrcode-window.component';

@Injectable({
    providedIn: 'root',
})
export class MeetingStateHolderService {
    constructor(
        ipc: IPCService,
        readonly windowStackService: WindowStackService,
        readonly snackBar: MatSnackBar,
    ) {
        ipc.on('show-token', (event, data: { accessToken: string }) =>
            this.showToken(data.accessToken),
        );

        ipc.on(
            'take-over',
            (event, data: { controlToken: string; meeting: any }) =>
                this.takeOver(data.meeting),
        );

        ipc.on('server-disconnected', () => this.disconnected());

        ipc.on('server-exception', (event, data: any) => {
            snackBar.open('Server exception catched', 'Dismiss', {
                duration: 4000,
            });
            console.log('server-exception', data);
        });
    }

    private disconnected() {
        this.windowStackService.closeAllWindow();
    }

    private showToken(accessToken: string) {
        this.windowStackService.showWindow({
            type: TokenQrcodeWindowComponent,
            data: accessToken,
        });
    }

    private takeOver(meeting: any) {
        this.windowStackService.closeAllWindow();
    }
}
