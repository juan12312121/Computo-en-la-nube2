import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BotonCrearPost } from './boton-crear-post';

describe('BotonCrearPost', () => {
  let component: BotonCrearPost;
  let fixture: ComponentFixture<BotonCrearPost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BotonCrearPost]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BotonCrearPost);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
