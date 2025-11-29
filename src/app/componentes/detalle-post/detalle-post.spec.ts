import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetallePost } from './detalle-post';

describe('DetallePost', () => {
  let component: DetallePost;
  let fixture: ComponentFixture<DetallePost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetallePost]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetallePost);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
