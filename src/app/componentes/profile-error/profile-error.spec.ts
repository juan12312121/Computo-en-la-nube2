import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileError } from './profile-error';

describe('ProfileError', () => {
  let component: ProfileError;
  let fixture: ComponentFixture<ProfileError>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileError]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfileError);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
