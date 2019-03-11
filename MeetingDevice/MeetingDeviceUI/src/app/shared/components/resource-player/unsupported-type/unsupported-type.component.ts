import {Component, OnInit} from '@angular/core';
import {ControllableComponent} from '../../controllable/controllable.component';

@Component({
    selector: 'app-unsupported-type',
    templateUrl: './unsupported-type.component.html',
    styleUrls: ['./unsupported-type.component.css']
})
export class UnsupportedTypeComponent extends ControllableComponent implements OnInit {

    constructor() {
        super();
    }

    ngOnInit() {
    }

}
