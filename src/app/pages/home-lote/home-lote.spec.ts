import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomeLoteComponent } from './home-lote';

describe('HomeLoteComponent', () => {
  let component: HomeLoteComponent;
  let fixture: ComponentFixture<HomeLoteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HomeLoteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeLoteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should filter lots by type', () => {
    component.filterType('premium');
    expect(component.lotesFiltered.length).toBe(2);
    expect(component.lotesFiltered.every(lote => lote.tipo === 'premium')).toBeTrue();
  });

  it('should show all lots when filter is empty', () => {
    component.filterType('');
    expect(component.lotesFiltered.length).toBe(component.lotes.length);
  });

  it('should open modal when viewing details', () => {
    const lote = component.lotes[0];
    component.verDetalles(lote);
    expect(component.mostrarModal).toBeTrue();
    expect(component.loteSeleccionado).toBe(lote);
  });

  it('should close modal', () => {
    component.cerrarModal();
    expect(component.mostrarModal).toBeFalse();
    expect(component.loteSeleccionado).toBeNull();
  });
});