import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Completopost } from './completopost';

describe('Completopost', () => {
  let component: Completopost;
  let fixture: ComponentFixture<Completopost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Completopost]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Completopost);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
