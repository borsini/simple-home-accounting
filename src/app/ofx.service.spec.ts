import { TestBed, inject } from '@angular/core/testing';

import { OfxService } from './ofx.service';

describe('OfxService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [OfxService]
    });
  });

  it('should be created', inject([OfxService], (service: OfxService) => {
    expect(service).toBeTruthy();
  }));
});
