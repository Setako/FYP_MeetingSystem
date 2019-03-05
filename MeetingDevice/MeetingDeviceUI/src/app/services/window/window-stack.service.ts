import {
    ApplicationRef,
    ChangeDetectorRef,
    ComponentFactoryResolver,
    ComponentRef,
    Injectable,
    Injector,
} from '@angular/core';
import { WINDOW_DATA, WindowRef } from './window-ref';
import { WindowData } from './window-data';
import { WindowComponent } from '../../shared/components/window/window.component';
import { AppComponent } from '../../app.component';

@Injectable({
    providedIn: 'root',
})
export class WindowStackService {
    private windowComponentStack: WindowRef<any>[] = [];
    private windowComponentsContainer: AppComponent;

    constructor(private resolver: ComponentFactoryResolver) {}

    public registerWindowsContainer(app: AppComponent) {
        this.windowComponentsContainer = app;
    }

    showWindow<T>(data: WindowData<T>): WindowRef<T> {
        console.log('show' + data.type.name);
        this.windowComponentStack.forEach(ref => ref.placeBehind());
        const factory = this.resolver.resolveComponentFactory(WindowComponent);

        const injector = Injector.create({
            providers: [
                {
                    provide: WINDOW_DATA,
                    useValue: data, // edit
                },
            ],
        });
        const windowCompRef: ComponentRef<
            WindowComponent<T>
        > = this.windowComponentsContainer.createComponent(
            factory,
            0,
            injector,
        ) as ComponentRef<WindowComponent<T>>;

        const windowRef = new WindowRef<T>(windowCompRef);
        windowRef.placeTop();
        this.windowComponentStack.push(windowRef);
        return windowRef;
    }

    closeCurrentWindow() {
        this.windowComponentStack.pop().close();
    }

    getCurrentWindow() {
        return this.windowComponentStack.length > 0
            ? this.windowComponentStack[this.windowComponentStack.length - 1]
            : null;
    }

    closeAllWindow() {
        while (this.windowComponentStack.length > 0) {
            this.closeCurrentWindow();
        }
    }
}
