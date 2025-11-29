import { TestBed } from '@angular/core/testing';

import { Temas } from './temas';

describe('Temas', () => {
  let service: Temas;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Temas);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
