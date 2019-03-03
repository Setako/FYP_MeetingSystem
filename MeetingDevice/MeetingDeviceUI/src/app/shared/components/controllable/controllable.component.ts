import { Component, HostBinding, OnInit } from '@angular/core';

@Component({
    selector: 'app-controllable',
    templateUrl: './controllable.component.html',
    styleUrls: [],
})
export class ControllableComponent implements OnInit {
    @HostBinding('style.zIndex')
    zIndex: number;

    constructor() {}

    remoteControl(action: number, data: object) {}

    ngOnInit() {}
}
