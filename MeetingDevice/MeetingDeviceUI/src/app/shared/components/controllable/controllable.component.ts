import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-controllable',
    templateUrl: './controllable.component.html',
    styleUrls: [],
})
export class ControllableComponent implements OnInit {
    constructor() {}

    remoteControl(action: string, data: any) {}

    ngOnInit() {}
}
