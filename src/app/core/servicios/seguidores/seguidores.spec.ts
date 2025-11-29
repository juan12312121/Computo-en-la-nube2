import { TestBed } from '@angular/core/testing';

import { Seguidores } from './seguidores';

describe('Seguidores', () => {
  let service: Seguidores;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Seguidores);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
