import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FotosPerfil } from './fotos-perfil';

describe('FotosPerfil', () => {
  let component: FotosPerfil;
  let fixture: ComponentFixture<FotosPerfil>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FotosPerfil]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FotosPerfil);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
