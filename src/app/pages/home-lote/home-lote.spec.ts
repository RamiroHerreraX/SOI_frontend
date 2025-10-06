import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeLote } from './home-lote';

describe('HomeLote', () => {
  let component: HomeLote;
  let fixture: ComponentFixture<HomeLote>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeLote]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeLote);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
