import { TestBed } from '@angular/core/testing';

import { Likes } from './likes';

describe('Likes', () => {
  let service: Likes;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Likes);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
