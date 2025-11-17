import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppSidebarSugerencias } from './app-sidebar-sugerencias';

describe('AppSidebarSugerencias', () => {
  let component: AppSidebarSugerencias;
  let fixture: ComponentFixture<AppSidebarSugerencias>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppSidebarSugerencias]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppSidebarSugerencias);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
