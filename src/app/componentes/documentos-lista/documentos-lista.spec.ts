import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentosLista } from './documentos-lista';

describe('DocumentosLista', () => {
  let component: DocumentosLista;
  let fixture: ComponentFixture<DocumentosLista>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentosLista]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocumentosLista);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
