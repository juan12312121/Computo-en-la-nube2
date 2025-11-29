import { TestBed } from '@angular/core/testing';

import { NoMeInteresa } from './no-me-interesa';

describe('NoMeInteresa', () => {
  let service: NoMeInteresa;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NoMeInteresa);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
