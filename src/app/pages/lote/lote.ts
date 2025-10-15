import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { LoteService } from '../../services/lote';
import { UbicacionService } from '../../services/ubicacion.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { UsersService } from '../../services/users.service';
import { HeaderAdmin } from "../../shared/header-admin/header-admin";

declare var bootstrap: any;

@Component({
  selector: 'app-lote',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    NgSelectModule,
    HeaderAdmin
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
  selectedFile: File | null = null;
  previewImagen: string | ArrayBuffer | null = null;
  


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
    next: data => {
      // Preparamos la URL de la imagen para cada lote
      this.lotes = data.map(lote => {
        const url = lote.imagen ? `http://localhost:3000${lote.imagen}` : 'assets/default-lote.jpg';
        console.log('Lote:', lote.numLote, 'Imagen URL:', url); // <-- aquí ves qué URL genera
        return {
          ...lote,
          imagenUrl: url
        };
      });
    },
    error: err => console.error('Error al cargar lotes', err)
  });
}



  openForm(): void {
    this.isEdit = false;
    this.currentLote = {};
    this.previewImagen = null;  
    this.selectedFile = null;   
    const modal = new bootstrap.Modal(document.getElementById('loteModal')!);
    modal.show();
  }

editLote(lote: any): void {
  this.isEdit = true;

  // Mapear todos los campos del lote al currentLote
  this.currentLote = {
    ...lote,
    numLote: lote.numlote || '',
    fecha_disponibilidad: lote.fecha_disponibilidad
      ? new Date(lote.fecha_disponibilidad).toISOString().slice(0, 10)
      : ''
  };

  // Estado y ciudad
  this.selectedEstado = lote.id_estado || null;
  this.selectedCiudad = lote.id_ciudad || null;

  // Limpiar arrays
  this.ciudades = [];
  this.colonias = [];

  this.previewImagen = lote.imagen
    ? `http://localhost:3000${lote.imagen}`
    : null;
  // Cargar ciudades si hay estado seleccionado
  if (this.selectedEstado) {
    this.ubicacionService.getCiudades(this.selectedEstado).subscribe({
      next: ciudades => {
        this.ciudades = ciudades;

        // Cargar colonias si hay ciudad seleccionada
        if (this.selectedCiudad) {
          this.ubicacionService.getColonias(this.selectedCiudad).subscribe({
            next: colonias => {
              this.colonias = colonias;

              // Asignar colonia si existe
              if (lote.id_colonia) {
                const col = colonias.find(c => c.id_colonia === lote.id_colonia);
                this.currentLote.nombre_colonia_nueva = col?.nombre_colonia || '';
              }
            },
            error: err => console.error('Error al cargar colonias', err)
          });
        }
      },
      error: err => console.error('Error al cargar ciudades', err)
    });
  }

  // Abrir modal
  const modal = new bootstrap.Modal(document.getElementById('loteModal')!);
  modal.show();
}

// Dentro de tu componente Lote
getImagenUrl(lote: any): string {
    if (!lote.imagen) return 'assets/default-lote.jpg';
    return `http://localhost:3000/${lote.imagen}`;
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




onFileSelected(event: any) {
  if (event.target.files && event.target.files.length > 0) {
    const file = event.target.files[0]; // guardar en una variable local
    this.selectedFile = file;

    // Mostrar preview
    const reader = new FileReader();
    reader.onload = e => this.previewImagen = reader.result;

    // ✅ pasar solo file, no this.selectedFile
    reader.readAsDataURL(file);
  }
}





  saveLote(): void {
  try {
    if (!this.selectedEstado) return alert('Debes seleccionar un estado');
    if (!this.selectedCiudad) return alert('Debes seleccionar una ciudad');

    const coloniaNombre = this.currentLote.nombre_colonia_nueva?.trim();
    const coloniaExistenteId = this.currentLote.id_colonia;
    if (!coloniaNombre && !coloniaExistenteId) return alert('Debes escribir o seleccionar una colonia');

    const ciudadObj = this.ciudades.find(c => c.id_ciudad == this.selectedCiudad);
    if (!ciudadObj) return alert('No se pudo determinar la ciudad seleccionada');
    const idCiudad = ciudadObj.id_ciudad;
    const idEstado = ciudadObj.id_estado || this.selectedEstado;

    const formData = new FormData();
    formData.append('tipo', this.currentLote.tipo);
    formData.append('numLote', this.currentLote.numLote);
    formData.append('manzana', this.currentLote.manzana || '');
    formData.append('direccion', this.currentLote.direccion);
    formData.append('id_ciudad', idCiudad);
    formData.append('id_estado', idEstado);
    formData.append('superficie_m2', this.currentLote.superficie_m2 || '');
    formData.append('precio', this.currentLote.precio || '');
    formData.append('valor_avaluo', this.currentLote.valor_avaluo || '');
    formData.append('num_habitaciones', this.currentLote.num_habitaciones || '');
    formData.append('num_banos', this.currentLote.num_banos || '');
    formData.append('num_estacionamientos', this.currentLote.num_estacionamientos || '');
    formData.append('servicios', this.currentLote.servicios || '');
    formData.append('descripcion', this.currentLote.descripcion || '');
    formData.append('topografia', this.currentLote.topografia || '');
    formData.append('documentacion', this.currentLote.documentacion || '');
    formData.append('estado_propiedad', this.currentLote.estado_propiedad);
    formData.append('fecha_disponibilidad', this.currentLote.fecha_disponibilidad || '');
    formData.append('id_user', this.currentLote.id_user);
    formData.append('id_colonia', coloniaExistenteId || '');
    formData.append('nombre_colonia_nueva', coloniaNombre || '');
    formData.append('codigo_postal', this.codigoPostal || '');

    if (this.selectedFile) {
      formData.append('imagen', this.selectedFile);
    }

    if (this.isEdit) {
      this.loteService.update(this.currentLote.id_propiedad, formData).subscribe({
        next: () => {
          this.loadLotes();
          bootstrap.Modal.getInstance(document.getElementById('loteModal')!)?.hide();
          this.resetForm();
        },
        error: err => alert(err.error?.error || 'Error al actualizar lote')
      });
    } else {
      this.loteService.create(formData).subscribe({
        next: () => {
          this.loadLotes();
          bootstrap.Modal.getInstance(document.getElementById('loteModal')!)?.hide();
          this.resetForm();
        },
        error: err => alert(err.error?.error || 'Error al crear lote')
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
  this.previewImagen = null;
  this.selectedFile = null;   
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