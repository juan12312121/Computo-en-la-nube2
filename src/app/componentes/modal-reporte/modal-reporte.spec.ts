import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalReporte } from './modal-reporte';

describe('ModalReporte', () => {
  let component: ModalReporte;
  let fixture: ComponentFixture<ModalReporte>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalReporte]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalReporte);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
