import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WelcomeEditorComponent } from './welcome-editor.component';

describe('WelcomeEditorComponent', () => {
  let component: WelcomeEditorComponent;
  let fixture: ComponentFixture<WelcomeEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WelcomeEditorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WelcomeEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
