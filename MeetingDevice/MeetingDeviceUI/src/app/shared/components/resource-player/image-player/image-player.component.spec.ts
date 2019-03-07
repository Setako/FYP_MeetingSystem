import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ImagePlayerComponent } from './image-player.component';

describe('ImagePlayerComponent', () => {
  let component: ImagePlayerComponent;
  let fixture: ComponentFixture<ImagePlayerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ImagePlayerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ImagePlayerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
