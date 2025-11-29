import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalCambiarBanner } from './modal-cambiar-banner';

describe('ModalCambiarBanner', () => {
  let component: ModalCambiarBanner;
  let fixture: ComponentFixture<ModalCambiarBanner>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalCambiarBanner]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalCambiarBanner);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
