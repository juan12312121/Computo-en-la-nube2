import { TestBed } from '@angular/core/testing';

import { Fotos } from './fotos';

describe('Fotos', () => {
  let service: Fotos;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Fotos);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
