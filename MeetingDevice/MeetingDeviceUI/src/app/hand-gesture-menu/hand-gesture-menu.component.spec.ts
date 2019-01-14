import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HandGestureMenuComponent } from './hand-gesture-menu.component';

describe('HandGestureMenuComponent', () => {
  let component: HandGestureMenuComponent;
  let fixture: ComponentFixture<HandGestureMenuComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HandGestureMenuComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HandGestureMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
