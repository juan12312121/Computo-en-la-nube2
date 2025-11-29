import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeccionesGrid } from './secciones-grid';

describe('SeccionesGrid', () => {
  let component: SeccionesGrid;
  let fixture: ComponentFixture<SeccionesGrid>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeccionesGrid]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeccionesGrid);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
