import { TestBed } from '@angular/core/testing';

import { Ocultas } from './ocultas';

describe('Ocultas', () => {
  let service: Ocultas;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Ocultas);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
