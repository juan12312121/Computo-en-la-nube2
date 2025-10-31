import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PublicacionesPerfil } from './publicaciones-perfil';

describe('PublicacionesPerfil', () => {
  let component: PublicacionesPerfil;
  let fixture: ComponentFixture<PublicacionesPerfil>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicacionesPerfil]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PublicacionesPerfil);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
