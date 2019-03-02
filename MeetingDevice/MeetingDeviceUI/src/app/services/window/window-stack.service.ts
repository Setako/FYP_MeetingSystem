import {ComponentFactoryResolver, Injectable, Injector, Type, ViewContainerRef} from '@angular/core';
import {WINDOW_DATA, WindowRef} from './WindowRef';

@Injectable({
    providedIn: 'root'
})
export class WindowStackService {

    private windowComponentPool: WindowRef<any>[] = [];
    private windowComponentsContainer: ViewContainerRef;

    constructor(
        private resolver: ComponentFactoryResolver
    ) {
    }

    public registerWindowsContainer(viewContainerRef: ViewContainerRef) {
        this.windowComponentsContainer = viewContainerRef;
    }


    showWindow<T>(type: Type<T>, data: any): WindowRef<T> {
        this.windowComponentPool.forEach(ref => ref.placeBehind());
        const factory = this.resolver.resolveComponentFactory(type);
        const injector = Injector.create({
            providers: [
                {
                    provide: WINDOW_DATA,
                    useValue: data // edit
                }
            ]
        });
        const compRef = this.windowComponentsContainer.createComponent(factory, 0, injector);
        const windowRef = new WindowRef(compRef);
        windowRef.placeTop();
        return windowRef;
    }
}
