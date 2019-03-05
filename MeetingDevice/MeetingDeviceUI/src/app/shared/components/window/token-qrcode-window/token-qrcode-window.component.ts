import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { DeviceService } from '../../../../services/device.service';
import { MatSnackBar } from '@angular/material';
import { WINDOW_DATA } from '../../../../services/window/window-ref';
import { WindowData } from '../../../../services/window/window-data';
import { QRCodeUtil } from '../../../../utils/QRCodeUtil';

@Component({
    selector: 'app-token-qrcode-window',
    templateUrl: './token-qrcode-window.component.html',
    styleUrls: ['./token-qrcode-window.component.css'],
})
export class TokenQrcodeWindowComponent implements OnInit {
    public qrImageUrl = '';

    constructor(
        private deviceService: DeviceService,
        private snackBar: MatSnackBar,
        @Inject(WINDOW_DATA) data: WindowData<TokenQrcodeWindowComponent>,
        private cdr: ChangeDetectorRef,
    ) {
        QRCodeUtil.toDataUrl(data.data).subscribe(url => {
            this.qrImageUrl = url;
            console.log(url);
            cdr.detectChanges();
        });
    }

    ngOnInit() {}

    update() {}
}
