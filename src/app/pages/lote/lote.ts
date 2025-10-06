import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { LoteService } from '../../services/lote';
import { UbicacionService } from '../../services/ubicacion.service';

declare var bootstrap: any;

@Component({
  selector: 'app-lote',
  standalone: true, 
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule
  ],
  templateUrl: './lote.html',
  styleUrls: ['./lote.css']
})
export class Lote implements OnInit {

  lotes: any[] = [];
  currentLote: any = {};
  isEdit: boolean = false;
  estados: any[] = [];
  ciudades: any[] = [];
  colonias: any[] = [];

  estadoControl = new FormControl();
  ciudadControl = new FormControl();
  coloniaControl = new FormControl();

  selectedEstado: any;
  selectedCiudad: any;

  constructor(private loteService: LoteService, private ubicacionService: UbicacionService) { }

  ngOnInit(): void {
    this.loadLotes();

    this.ubicacionService.getEstados().subscribe({
    next: data => this.estados = data,
    error: err => console.error('Error al cargar estados', err)
  });

  // Cuando se selecciona un estado, traer ciudades
  this.estadoControl.valueChanges.subscribe(val => {
    this.selectedEstado = this.estados.find(e => e.nombre_estado === val);
    if (this.selectedEstado) {
      this.ubicacionService.getCiudades(this.selectedEstado.id_estado)
        .subscribe({
          next: data => this.ciudades = data,
          error: err => console.error('Error al cargar ciudades', err)
        });
    } else {
      this.ciudades = []; // limpiar ciudades si no hay selección válida
      this.colonias = []; // limpiar colonias también
    }
  });

  // Cuando se selecciona una ciudad, traer colonias
  this.ciudadControl.valueChanges.subscribe(val => {
    this.selectedCiudad = this.ciudades.find(c => c.nombre_ciudad === val);
    if (this.selectedCiudad) {
      this.ubicacionService.getColonias(this.selectedCiudad.id_ciudad)
        .subscribe({
          next: data => this.colonias = data,
          error: err => console.error('Error al cargar colonias', err)
        });
    } else {
      this.colonias = []; // limpiar colonias si no hay selección válida
    }
  });
  }

  // Cargar todos los lotes
  loadLotes(): void {
    this.loteService.getAll().subscribe({
      next: data => this.lotes = data,
      error: err => console.error('Error al cargar lotes', err)
    });
  }

  // Abrir formulario para nuevo lote
  openForm(): void {
    this.isEdit = false;
    this.currentLote = {};
    const modal = new bootstrap.Modal(document.getElementById('loteModal')!);
    modal.show();
  }

  // Editar lote existente
  editLote(lote: any): void {
    this.isEdit = true;
    this.currentLote = { ...lote };
    const modal = new bootstrap.Modal(document.getElementById('loteModal')!);
    modal.show();
  }

  // Guardar lote (crear o actualizar)
  saveLote(): void {
    if (this.isEdit) {
      this.loteService.update(this.currentLote.id_propiedad, this.currentLote)
        .subscribe({
          next: () => {
            this.loadLotes();
            bootstrap.Modal.getInstance(document.getElementById('loteModal')!)?.hide();
          },
          error: err => console.error('Error al actualizar lote', err)
        });
    } else {
      this.loteService.create(this.currentLote)
        .subscribe({
          next: () => {
            this.loadLotes();
            bootstrap.Modal.getInstance(document.getElementById('loteModal')!)?.hide();
          },
          error: err => console.error('Error al crear lote', err)
        });
    }
  }

  // Eliminar lote
  deleteLote(id: number): void {
    if (confirm('¿Seguro que quieres eliminar este lote?')) {
      this.loteService.delete(id)
        .subscribe({
          next: () => this.loadLotes(),
          error: err => console.error('Error al eliminar lote', err)
        });
    }
  }

  // Scroll hacia arriba
  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
