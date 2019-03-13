import {Injectable} from '@angular/core';
import {WindowStackService} from '../window/window-stack.service';
import {ControllableComponent} from '../../shared/components/controllable/controllable.component';

@Injectable({
    providedIn: 'root'
})
export class GestureActionHandlerService {

    constructor(private windowStack: WindowStackService) {
    }

    onGesture(data: any) {
        const currentWindow = this.windowStack.getCurrentWindow();
        if (currentWindow != null) {
            if (currentWindow.componentRef != null && currentWindow.componentRef.instance != null) {
                if (currentWindow.componentRef.instance.compRef.instance instanceof ControllableComponent) {
                    const controllable: ControllableComponent = currentWindow.componentRef.instance.compRef.instance;
                    controllable.remoteControl(data);
                }
            }
        }
    }
}
