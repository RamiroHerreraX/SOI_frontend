import { Component, OnInit, HostListener } from '@angular/core';
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
    HttpClientModule,
    NgSelectModule
  ],
  templateUrl: './lote.html',
  styleUrls: ['./lote.css']
})
export class Lote implements OnInit {

  showBtnTop: boolean = false;
  showBtnDown: boolean = true;

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
  coloniaSeleccionada: any;
  encargados: any[] = [];
  


  constructor(private loteService: LoteService, private ubicacionService: UbicacionService, private userService: UsersService) { }

  ngOnInit(): void {
    this.loadLotes();
    this.loadEncargados();


    // Cargar estados
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
        this.ciudades = [];
        this.colonias = [];
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
         this.colonias = [];
       }
     });
  }

  // === CRUD Lotes ===
  loadLotes(): void {
    this.loteService.getAll().subscribe({
      next: data => this.lotes = data,
      error: err => console.error('Error al cargar lotes', err)
    });
  }

  openForm(): void {
    this.isEdit = false;
    this.currentLote = {};
    const modal = new bootstrap.Modal(document.getElementById('loteModal')!);
    modal.show();
  }

  editLote(lote: any): void {
    this.isEdit = true;
    this.currentLote = { ...lote };
    const modal = new bootstrap.Modal(document.getElementById('loteModal')!);
    modal.show();
  }

 onColoniaChange(event: any) {
  if (typeof event === 'string') {
    // Colonia nueva
    this.currentLote.nombre_colonia_nueva = event;
    this.currentLote.id_colonia = null;
  } else if (event && event.id_colonia) {
    // Colonia existente
    this.currentLote.id_colonia = event.id_colonia;
    this.currentLote.nombre_colonia_nueva = null;
  }
}


  saveLote(): void {
  try {
    // --- Validaciones básicas ---
    if (!this.selectedEstado) {
      alert('Debes seleccionar un estado');
      return;
    }

    if (!this.selectedCiudad) {
      alert('Debes seleccionar una ciudad');
      return;
    }

    const colonia = this.currentLote.id_colonia || this.currentLote.nombre_colonia_nueva;
if (!colonia || colonia.toString().trim() === '') {
  alert('Debes escribir o seleccionar una colonia');
  return;
}


    if (!colonia && !this.currentLote.id_colonia && !this.codigoPostal) {
      alert('Debes ingresar el código postal para la colonia nueva');
      return;
    }

    // --- Obtener ciudad completa desde selección ---
    const ciudadObj = this.ciudades.find(c => c.id_ciudad == this.selectedCiudad);
    const idCiudad = ciudadObj?.id_ciudad;
    const idEstado = ciudadObj?.id_estado || this.selectedEstado?.id_estado;

    if (!idCiudad) {
      alert('No se pudo determinar la ciudad seleccionada');
      return;
    }

    // --- Buscar si la colonia ya existe ---
    const coloniaExistente = this.currentLote.id_colonia
  ? this.colonias.find(c => c.id_colonia === this.currentLote.id_colonia)
  : null;


    // --- Preparar objeto para enviar ---
    const loteData: any = {
      tipo: this.currentLote.tipo,
      numLote: this.currentLote.numLote,
      manzana: this.currentLote.manzana,
      direccion: this.currentLote.direccion,
      id_ciudad: idCiudad,
      id_estado: idEstado,
      superficie_m2: this.currentLote.superficie_m2,
      precio: this.currentLote.precio,
      valor_avaluo: this.currentLote.valor_avaluo,
      num_habitaciones: this.currentLote.num_habitaciones,
      num_banos: this.currentLote.num_banos,
      num_estacionamientos: this.currentLote.num_estacionamientos,
      servicios: this.currentLote.servicios,
      descripcion: this.currentLote.descripcion,
      topografia: this.currentLote.topografia,
      documentacion: this.currentLote.documentacion,
      estado_propiedad: this.currentLote.estado_propiedad,
      fecha_disponibilidad: this.currentLote.fecha_disponibilidad,
      imagen: this.currentLote.imagen,
      id_user: this.currentLote.id_user,
    };

    // --- Manejo de colonia ---
    if (coloniaExistente) {
  loteData.id_colonia = coloniaExistente.id_colonia;
  loteData.nombre_colonia_nueva = null;
} else {
  loteData.id_colonia = null;
  loteData.nombre_colonia_nueva = colonia;
  loteData.codigo_postal = this.codigoPostal;
}


    console.log("📦 Datos preparados para enviar al backend:", loteData);

    // --- Llamada a servicio ---
    if (this.isEdit) {
      this.loteService.update(this.currentLote.id_propiedad, loteData).subscribe({
        next: (res) => {
          this.loadLotes();
          bootstrap.Modal.getInstance(document.getElementById('loteModal')!)?.hide();
          this.resetForm();
        },
        error: err => {
          console.error('Error al actualizar lote', err);
          alert(err.error?.error || 'Error al actualizar lote');
        }
      });
    } else {
      this.loteService.create(loteData).subscribe({
        next: (res: any) => {
          this.loadLotes();
          bootstrap.Modal.getInstance(document.getElementById('loteModal')!)?.hide();

          // Si el backend creó una colonia nueva, asignar id_colonia para futuras ediciones
          if (res?.id_colonia) {
            this.currentLote.id_colonia = res.id_colonia;
          }

          this.resetForm();
        },
        error: err => {
          console.error('Error al crear lote', err);
          alert(err.error?.error || 'Error al crear lote');
        }
      });
    }

  } catch (error) {
    console.error('Error en saveLote:', error);
    alert('Ocurrió un error inesperado');
  }
}

// --- Método para limpiar formulario después de crear/editar ---
resetForm(): void {
  this.currentLote = {};
  this.codigoPostal = '';
  this.colonias = [];
  this.ciudades = [];
  this.selectedEstado = null;
  this.selectedCiudad = null;
}



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

          // Asignar estado y ciudad automáticamente
          this.selectedEstado = data.id_estado;
          this.selectedCiudad = data.id_ciudad;

          // Cargar ciudades del estado
          this.ubicacionService.getCiudades(data.id_estado).subscribe({
            next: ciudades => this.ciudades = ciudades,
          });

          // ✅ Usar solo colonias que vienen del CP
          this.colonias = data.colonias;
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

  // === Scroll Buttons ===
  // Lote.ts (o home-lote.ts)
@HostListener('window:scroll', [])
onWindowScroll() {
  const scrollPos = window.pageYOffset || document.documentElement.scrollTop;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;

  // Mostrar botón subir si scroll > 200
  this.showBtnTop = scrollPos > 200;
  // Mostrar botón bajar si scroll < altura total - 100
  this.showBtnDown = scrollPos < docHeight - 100;
}

// Función unificada para el botón
scrollToggle(): void {
  if (window.pageYOffset > 200) {
    // Si está abajo, subir
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    // Si está arriba, bajar
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }
}
}