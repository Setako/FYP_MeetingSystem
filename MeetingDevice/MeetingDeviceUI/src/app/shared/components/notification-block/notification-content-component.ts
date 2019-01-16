import {Component, ComponentFactoryResolver, ComponentRef, Input, OnDestroy, OnInit, ViewChild, ViewContainerRef} from '@angular/core';
import {NotificationBlockComponent, SysNotification} from './notification-block.component';

@Component({
  selector: 'app-notification-content',
  template: `
    <div style="margin-bottom: 10px">
      <div #blockFrame></div>
    </div>
  `
})
export class NotificationContentComponent implements OnInit, OnDestroy {
  private componentRef: ComponentRef<NotificationBlockComponent>;

  @ViewChild('blockFrame', {read: ViewContainerRef}) blockFrame: ViewContainerRef;
  @Input() notification: SysNotification;

  constructor(private componentFactoryResolver: ComponentFactoryResolver) {
  }

  ngOnInit() {
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(this.notification.componentType);
    this.componentRef = this.blockFrame.createComponent(componentFactory);
    this.componentRef.instance.notification = this.notification;
  }

  ngOnDestroy() {
    this.componentRef.destroy();
  }

}
