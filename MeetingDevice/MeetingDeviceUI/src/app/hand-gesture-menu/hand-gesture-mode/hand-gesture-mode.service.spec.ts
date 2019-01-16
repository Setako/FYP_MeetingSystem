import { TestBed, inject } from '@angular/core/testing';

import { HandGestureModeService } from './hand-gesture-mode.service';

describe('HandGestureModeService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HandGestureModeService]
    });
  });

  it('should be created', inject([HandGestureModeService], (service: HandGestureModeService) => {
    expect(service).toBeTruthy();
  }));
});
