import {
    Component,
    ComponentFactoryResolver,
    ComponentRef,
    HostBinding,
    Inject,
    Injector,
    OnInit,
    ViewChild,
    ViewContainerRef
} from '@angular/core';
import {WINDOW_DATA} from '../../../services/window/window-ref';
import {WindowData} from '../../../services/window/window-data';

@Component({
    selector: 'app-window',
    templateUrl: './window.component.html',
    styleUrls: ['./window.component.css']
})
export class WindowComponent<T> implements OnInit {
    @HostBinding('style.zIndex')
    zIndex: number;

    @ViewChild('content', {read: ViewContainerRef})
    viewContentRef: ViewContainerRef;

    compRef: ComponentRef<T>;

    constructor(private resolver: ComponentFactoryResolver,
                @Inject(WINDOW_DATA) private data: WindowData<T>) {
        console.log('created');
    }

    ngOnInit() {
        console.log('init');
        const factory = this.resolver.resolveComponentFactory(this.data.type);
        const injector = Injector.create({
            providers: [
                {
                    provide: WINDOW_DATA,
                    useValue: this.data, // edit
                },
            ],
        });
        this.compRef = this.viewContentRef.createComponent(
            factory,
            0,
            injector,
        );
    }

}
