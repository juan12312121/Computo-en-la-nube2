import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileLoading } from './profile-loading';

describe('ProfileLoading', () => {
  let component: ProfileLoading;
  let fixture: ComponentFixture<ProfileLoading>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileLoading]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfileLoading);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
