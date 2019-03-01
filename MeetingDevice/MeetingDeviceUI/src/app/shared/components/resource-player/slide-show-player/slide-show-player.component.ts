import {Component, OnInit} from '@angular/core';
import {ControllableComponent} from '../../controllable/controllable.component';

@Component({
  selector: 'app-slide-show-player',
  templateUrl: './slide-show-player.component.html',
  styleUrls: ['./slide-show-player.component.css']
})
export class SlideShowPlayerComponent extends ControllableComponent implements OnInit {
  public static REMOTE_ACTION_PREV_PAGE = 0;
  public static REMOTE_ACTION_NEXT_PAGE = 1;

  constructor() {
    super();
  }


  remoteControl(action: number, data: object) {
    switch (action) {
      case SlideShowPlayerComponent.REMOTE_ACTION_NEXT_PAGE:
        break;
      case SlideShowPlayerComponent.REMOTE_ACTION_PREV_PAGE:
        break;
    }
  }

  ngOnInit() {
  }

}
