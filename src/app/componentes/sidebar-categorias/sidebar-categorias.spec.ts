import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SidebarCategorias } from './sidebar-categorias';

describe('SidebarCategorias', () => {
  let component: SidebarCategorias;
  let fixture: ComponentFixture<SidebarCategorias>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarCategorias]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SidebarCategorias);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
