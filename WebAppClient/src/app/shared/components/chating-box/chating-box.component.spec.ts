import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatingBoxComponent } from './chating-box.component';

describe('ChatingBoxComponent', () => {
  let component: ChatingBoxComponent;
  let fixture: ComponentFixture<ChatingBoxComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChatingBoxComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChatingBoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
