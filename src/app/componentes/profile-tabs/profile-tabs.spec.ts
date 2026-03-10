import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileTabs } from './profile-tabs';

describe('ProfileTabs', () => {
  let component: ProfileTabs;
  let fixture: ComponentFixture<ProfileTabs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileTabs]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfileTabs);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
