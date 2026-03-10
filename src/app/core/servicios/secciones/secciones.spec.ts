import { TestBed } from '@angular/core/testing';

import { Secciones } from './secciones';

describe('Secciones', () => {
  let service: Secciones;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Secciones);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
