import {ComponentFactoryResolver, ComponentRef, Injectable, Injector, Type, ViewContainerRef} from '@angular/core';
import {WINDOW_DATA, WindowRef} from '../shared/components/window/WindowRef';

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
    this.windowComponentPool.forEach(ref => ref.show = false);
    const factory = this.resolver.resolveComponentFactory(type);
    const injector = Injector.create({
      providers: [
        {
          provide: WINDOW_DATA,
          useValue: data //edit
        }
      ]
    });
    const compRef = this.windowComponentsContainer.createComponent(factory, 0, injector);
    return new WindowRef(compRef.instance);
  }
}
