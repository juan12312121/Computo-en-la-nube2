import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SidebarPerfil } from './sidebar-perfil';

describe('SidebarPerfil', () => {
  let component: SidebarPerfil;
  let fixture: ComponentFixture<SidebarPerfil>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarPerfil]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SidebarPerfil);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
