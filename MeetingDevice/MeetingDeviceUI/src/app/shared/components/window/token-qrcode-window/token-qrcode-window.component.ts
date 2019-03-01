import { Component, OnInit } from '@angular/core';
import { DeviceService } from '../../../../services/device.service';
import { QRCodeUtil } from '../../../../utils/QRCodeUtil';
import { map, mergeMap, retry } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material';
import { timer } from 'rxjs';

@Component({
    selector: 'app-token-qrcode-window',
    templateUrl: './token-qrcode-window.component.html',
    styleUrls: ['./token-qrcode-window.component.css'],
})
export class TokenQrcodeWindowComponent implements OnInit {
    public querying = true;
    public qrImageUrl: string;

    constructor(
        private deviceService: DeviceService,
        private snackBar: MatSnackBar,
    ) {}

    ngOnInit() {
        timer(0, 50000).subscribe(_ => {
            this.update();
        });
    }

    update() {
        this.querying = true;
        this.deviceService
            .getDeviceAccessToken()
            .pipe(
                mergeMap(res => QRCodeUtil.toDataUrl(res.token)),
                retry(1),
            )
            .subscribe(
                qrUrlData => {
                    this.qrImageUrl = qrUrlData;
                    this.querying = false;
                },
                err => {
                    this.snackBar.open('Failed to get device token', null, {
                        duration: 4000,
                    });
                    this.querying = false;
                },
            );
    }
}
