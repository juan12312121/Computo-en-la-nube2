import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppModalNoInteresa } from './app-modal-no-interesa';

describe('AppModalNoInteresa', () => {
  let component: AppModalNoInteresa;
  let fixture: ComponentFixture<AppModalNoInteresa>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppModalNoInteresa]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppModalNoInteresa);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
