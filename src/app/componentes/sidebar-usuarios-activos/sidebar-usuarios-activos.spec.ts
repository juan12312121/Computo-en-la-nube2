import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SidebarUsuariosActivos } from './sidebar-usuarios-activos';

describe('SidebarUsuariosActivos', () => {
  let component: SidebarUsuariosActivos;
  let fixture: ComponentFixture<SidebarUsuariosActivos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarUsuariosActivos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SidebarUsuariosActivos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
