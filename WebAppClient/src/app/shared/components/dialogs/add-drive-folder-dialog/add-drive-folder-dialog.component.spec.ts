import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddDriveFolderDialogComponent } from './add-drive-folder-dialog.component';

describe('AddDriveFolderDialogComponent', () => {
  let component: AddDriveFolderDialogComponent;
  let fixture: ComponentFixture<AddDriveFolderDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddDriveFolderDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddDriveFolderDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
