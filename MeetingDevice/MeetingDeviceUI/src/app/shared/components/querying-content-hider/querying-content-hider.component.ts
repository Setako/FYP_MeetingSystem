import {Component, Input, OnInit} from '@angular/core';

@Component({
    selector: 'app-querying-content-hider',
    templateUrl: './querying-content-hider.component.html',
    styleUrls: ['./querying-content-hider.component.css'],
})
export class QueryingContentHiderComponent implements OnInit {
    @Input() querying: boolean;
    @Input() queryingAction: string;

    constructor() {
    }

    ngOnInit() {
    }
}
