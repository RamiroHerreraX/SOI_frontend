import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { LoteService } from '../../services/lote';
import { UbicacionService } from '../../services/ubicacion.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { UsersService } from '../../services/users.service';

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
  codigoPostal: string = '';

  estadoControl = new FormControl();
  ciudadControl = new FormControl();
  coloniaControl = new FormControl();

  selectedEstado: any;
  selectedCiudad: any;
  encargados: any[] = [];


  constructor(private loteService: LoteService, private ubicacionService: UbicacionService, private userService: UsersService) { }

  ngOnInit(): void {
    this.loadLotes();
    this.loadEncargados();


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

  //Ubicación
  onEstadoChange(event: any): void {
  const idEstado = event.target.value;
  if (idEstado) {
    this.ubicacionService.getCiudades(idEstado).subscribe({
      next: data => {
        this.ciudades = data;
        this.colonias = [];
      },
      error: err => console.error('Error al cargar ciudades', err)
    });
  }
}

onCiudadChange(event: any): void {
  const idCiudad = event.target.value;
  if (idCiudad) {
    this.ubicacionService.getColonias(idCiudad).subscribe({
      next: data => this.colonias = data,
      error: err => console.error('Error al cargar colonias', err)
    });
  }
}

buscarPorCodigoPostal(): void {
  if (this.codigoPostal.length === 5) {
    this.ubicacionService.getCiudadPorCP(this.codigoPostal).subscribe({
      next: data => {
        if (data && data.id_ciudad) {
          this.selectedCiudad = data.id_ciudad;
          this.selectedEstado = data.id_estado;
          this.ubicacionService.getCiudades(data.id_estado).subscribe({
            next: ciudades => this.ciudades = ciudades,
          });
          this.ubicacionService.getColonias(data.id_ciudad).subscribe({
            next: colonias => this.colonias = colonias,
          });
        }
      },
      error: err => console.error('Error al buscar por código postal', err)
    });
  }
}

loadEncargados() {
    this.userService.getEncargados().subscribe(
      (data) => {
        this.encargados = data;
      },
      (error) => {
        console.error('Error al obtener encargados:', error);
      }
    );
  }


  // Scroll hacia arriba
  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
