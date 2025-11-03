import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { LoteService } from '../../services/lote';
import { UbicacionService } from '../../services/ubicacion.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { UsersService } from '../../services/users.service';
import { HeaderAdmin } from "../../shared/header-admin/header-admin";
import { FooterAdmin } from "../../shared/footer-admin/footer-admin";

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
    HeaderAdmin,
    FooterAdmin
],
  templateUrl: './lote.html',
  styleUrls: ['./lote.css']
})
export class Lote implements OnInit {

  showBtnTop: boolean = false;
  showBtnDown: boolean = true;
  isModalOpen: boolean = false; // <-- Control para ocultar footer/scroll

  lotes: any[] = [];
  currentLote: any = {};
  isEdit: boolean = false;
  estados: any[] = [];
  ciudades: any[] = [];
  colonias: any[] = [];
  codigoPostal: string = '';

  // No usamos estos FormControls en el template, pero se mantienen por si los usas para lógica reactiva.
  estadoControl = new FormControl(); 
  ciudadControl = new FormControl();
  coloniaControl = new FormControl();

  // Inicializados a null para que la validación 'required' funcione con <option [ngValue]="null">
  selectedEstado: any = null;
  selectedCiudad: any = null;
  coloniaSeleccionada: any;
  encargados: any[] = [];
  selectedFile: File | null = null;
  previewImagen: string | ArrayBuffer | null = null;
  
  // 💡 NUEVA PROPIEDAD PARA CONTROLAR EL ERROR DE ARCHIVO EN EL HTML
  fileError: boolean = false; 

  constructor(private loteService: LoteService, private ubicacionService: UbicacionService, private userService: UsersService) { }

  ngOnInit(): void {
    this.loadLotes();
    this.loadEncargados();

    // Cargar estados
    this.ubicacionService.getEstados().subscribe({
      next: data => this.estados = data,
      error: err => console.error('Error al cargar estados', err)
    });

    // Configurar el listener para cuando el modal se cierra por otras vías (Escape, click fuera)
    const modalElement = document.getElementById('loteModal');
    if (modalElement) {
        modalElement.addEventListener('hidden.bs.modal', this.onModalClose.bind(this));
    }
  }

  // === CRUD Lotes ===
  loadLotes(): void {
  this.loteService.getAll().subscribe({
    next: data => {
      // Preparamos la URL de la imagen para cada lote
      this.lotes = data.map(lote => {
        // Nota: Asumimos que la ruta del servidor de imágenes es 'http://localhost:3000'
        const url = lote.imagen ? `http://localhost:3000${lote.imagen}` : 'assets/default-lote.jpg';
        return {
          ...lote,
          imagenUrl: url
        };
      });
    },
    error: err => this.showToast('Error al cargar lotes. Inténtelo de nuevo.', 'danger') // Toast de error
  });
}


  openForm(): void {
    this.isEdit = false;
    this.currentLote = {};
    this.previewImagen = null;  
    this.selectedFile = null; 
    this.fileError = false; // 💡 Resetear error de archivo al abrir
    this.selectedEstado = null; // Reset para la validación
    this.selectedCiudad = null; // Reset para la validación

    // Muestra el modal y activa la bandera
    this.isModalOpen = true; 
    const modal = new bootstrap.Modal(document.getElementById('loteModal')!);
    modal.show();
  }
  
onModalClose(): void {
    // Método llamado al cerrar el modal (botón, X, escape)
    this.isModalOpen = false;
    this.resetForm(); // Opcional: limpiar el formulario al cerrar si no se guardó
}


editLote(lote: any): void {
  this.isEdit = true;
  this.isModalOpen = true; // Activa la bandera
  this.fileError = false; // 💡 Resetear error de archivo

  // Mapear todos los campos del lote al currentLote
  this.currentLote = {
    ...lote,
    numLote: lote.numlote || '',
    fecha_disponibilidad: lote.fecha_disponibilidad
      ? new Date(lote.fecha_disponibilidad).toISOString().slice(0, 10)
      : ''
  };
  
  // Asignar IDs para la validación del formulario
  this.selectedEstado = lote.id_estado || null;
  this.selectedCiudad = lote.id_ciudad || null;
  this.codigoPostal = lote.codigo_postal || '';


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
                // Asignar el nombre de la colonia al campo del ng-select
                this.currentLote.nombre_colonia_nueva = col?.nombre_colonia || '';
                // Asegurar que el id_colonia también esté presente si es una colonia existente
                this.currentLote.id_colonia = lote.id_colonia;
              } else if (lote.nombre_colonia_nueva) {
                 // Si se guardó una colonia nueva (sin id)
                 this.currentLote.nombre_colonia_nueva = lote.nombre_colonia_nueva;
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

getImagenUrl(lote: any): string {
    if (!lote.imagen) return 'assets/default-lote.jpg';
    // Es importante que esta ruta refleje tu configuración de backend/servidor de archivos.
    return `http://localhost:3000${lote.imagen}`; 
  }


 onColoniaChange(event: any) {
  // Asegurar que el ng-select asigna el valor correcto para que la validación funcione.
  if (typeof event === 'string' && event.trim().length > 0) {
    // Colonia nueva
    this.currentLote.nombre_colonia_nueva = event;
    this.currentLote.id_colonia = null;
  } else if (event && event.id_colonia) {
    // Colonia existente
    this.currentLote.id_colonia = event.id_colonia;
    this.currentLote.nombre_colonia_nueva = event.nombre_colonia; // Asignamos el nombre también
  } else {
     // Si se borra o selecciona nulo
     this.currentLote.id_colonia = null;
     this.currentLote.nombre_colonia_nueva = null;
  }
}

// 💡 FUNCIÓN ACTUALIZADA CON VALIDACIÓN DE TIPO DE ARCHIVO
onFileSelected(event: any) {
    const file: File = event.target.files[0];
    
    // 1. Resetear el estado de error y la selección
    this.fileError = false; 
    this.selectedFile = null;
    this.previewImagen = null;

    if (file) {
      // 2. Validación: Chequear si el tipo de archivo es una imagen
      if (!file.type.startsWith('image/')) {
        console.error("Tipo de archivo no válido. Solo se permiten imágenes.");
        this.fileError = true; // Establecer error a true para mostrar el mensaje en el HTML
        // Opcional: Limpiar el campo de archivo en el DOM si es posible, aunque es mejor dejar que el usuario reintente.
        // event.target.value = ''; 
        return;
      }

      // Si la validación pasa:
      this.selectedFile = file;
      
      // Mostrar preview de la imagen
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewImagen = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
}


  saveLote(): void {
    // Nota: La validación principal ahora se hace con [disabled]="loteForm.invalid" en el HTML
    
    try {
        // ************************************************************
        // 🛑 VALIDACIÓN ADICIONAL: Bloquear si hay error de archivo
        if (this.fileError) {
          this.showToast('No se puede guardar. Corrija el error del archivo de imagen.', 'danger');
          return;
        }
        // ************************************************************
        
        // Validación de seguridad/lógica (Mantenemos tu lógica de negocio)
        if (!this.selectedEstado) return this.showToast('Debes seleccionar un estado.', 'danger');
        if (!this.selectedCiudad) return this.showToast('Debes seleccionar una ciudad.', 'danger');

        const coloniaNombre = this.currentLote.nombre_colonia_nueva?.trim();
        const coloniaExistenteId = this.currentLote.id_colonia;
        if (!coloniaNombre && !coloniaExistenteId) return this.showToast('Debes escribir o seleccionar una colonia.', 'danger');

        // Usamos directamente los IDs seleccionados que vienen del ngModel
        const idCiudad = this.selectedCiudad;
        const idEstado = this.selectedEstado; 

        // ----------------------------------------------------
        // PASO CLAVE 1: NORMALIZACIÓN DE DATOS (Frontend)
        // ----------------------------------------------------
        
        // Creamos una copia para limpiar datos antes de FormData
        let dataToProcess = { ...this.currentLote };
        
        const nonBuildingTypes = ['terreno', 'local', 'otro'];
        
        // Lógica: Si el tipo no es 'casa' o 'depto', forzamos a null (o '') los campos de construcción
        if (nonBuildingTypes.includes(dataToProcess.tipo)) {
            // Establecemos a null o un string vacío. Como FormData convierte null a 'null' string,
            // es más seguro usar el string vacío '' para que el backend lo maneje con || null.
            dataToProcess.num_habitaciones = '';
            dataToProcess.num_banos = '';
            dataToProcess.num_estacionamientos = '';
        }

        // ----------------------------------------------------
        // PASO CLAVE 2: CONSTRUCCIÓN DEL FORMDATA
        // ----------------------------------------------------
        const formData = new FormData();
        
        // Normalizamos todos los campos opcionales a cadena vacía ('') si son null/undefined,
        // para que Joi pueda manejarlo correctamente en el backend.
        
        formData.append('tipo', dataToProcess.tipo);
        formData.append('numLote', dataToProcess.numLote);
        formData.append('manzana', dataToProcess.manzana || '');
        formData.append('direccion', dataToProcess.direccion);
        formData.append('id_ciudad', idCiudad);
        formData.append('id_estado', idEstado);
        
        // Campos numéricos/opcionales con normalización a string vacío
        formData.append('superficie_m2', dataToProcess.superficie_m2 || '');
        formData.append('precio', dataToProcess.precio || '');
        formData.append('valor_avaluo', dataToProcess.valor_avaluo || '');
        
        // Campos de construcción (ya normalizados en el Paso 1 si es 'terreno')
        formData.append('num_habitaciones', dataToProcess.num_habitaciones || '');
        formData.append('num_banos', dataToProcess.num_banos || '');
        formData.append('num_estacionamientos', dataToProcess.num_estacionamientos || '');
        
        // Otros campos opcionales
        formData.append('servicios', dataToProcess.servicios || '');
        formData.append('descripcion', dataToProcess.descripcion || '');
        formData.append('topografia', dataToProcess.topografia || '');
        formData.append('documentacion', dataToProcess.documentacion || '');
        formData.append('estado_propiedad', dataToProcess.estado_propiedad);
        formData.append('fecha_disponibilidad', dataToProcess.fecha_disponibilidad || '');
        formData.append('id_user', dataToProcess.id_user || ''); // Asegura que id_user se envíe (incluso vacío)
        
        // Campos de Colonia
        formData.append('id_colonia', coloniaExistenteId || ''); 
        formData.append('nombre_colonia_nueva', coloniaNombre || ''); 
        formData.append('codigo_postal', this.codigoPostal || '');

        if (this.selectedFile) {
            formData.append('imagen', this.selectedFile);
        }

        // ----------------------------------------------------
        // PASO 3: LLAMADA AL SERVICIO (Sin cambios)
        // ----------------------------------------------------
        if (this.isEdit) {
            this.loteService.update(this.currentLote.id_propiedad, formData).subscribe({
                // ... manejo de éxito y error ...
                next: () => {
                    this.loadLotes();
                    // ... (cierre de modal y toast)
                    this.showToast('Lote actualizado exitosamente.', 'success'); 
                    this.resetForm();
                },
                error: err => this.showToast(err.error?.error || 'Error al actualizar lote.', 'danger') 
            });
        } else {
            this.loteService.create(formData).subscribe({
                // ... manejo de éxito y error ...
                next: () => {
                    this.loadLotes();
                    // ... (cierre de modal y toast)
                    this.showToast('Lote creado exitosamente.', 'success'); 
                    this.resetForm();
                },
                error: err => this.showToast(err.error?.error || 'Error al crear lote.', 'danger')
            });
        }
        
    } catch (error) {
        console.error('Error en saveLote:', error);
        this.showToast('Ocurrió un error inesperado al guardar.', 'danger');
    }
}


// --- Método para limpiar formulario después de crear/editar ---
resetForm(): void {
  this.currentLote = {};
  this.codigoPostal = '';
  this.colonias = [];
  this.ciudades = [];
  this.selectedEstado = null; // Cambiado a null
  this.selectedCiudad = null; // Cambiado a null
  this.previewImagen = null;
  this.selectedFile = null;   
  this.fileError = false; // 💡 Resetear error de archivo
}


  deleteLote(id: number): void {
    if (confirm('¿Seguro que quieres eliminar este lote?')) {
      this.loteService.delete(id)
        .subscribe({
          next: () => {
                this.loadLotes();
                this.showToast('Lote eliminado correctamente.', 'success'); // Notificación de éxito
            },
          error: err => this.showToast('Error al eliminar lote: ' + err.error?.error, 'danger') // Notificación de error
        });
    }
  }

  //Ubicación
  onEstadoChange(event: any): void {
    // El evento viene del <select> y su valor es el id_estado
  const idEstado = event.target.value;
  this.selectedEstado = idEstado; // Actualizamos el selectedEstado
  this.selectedCiudad = null; // Limpiamos la ciudad
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
    // El evento viene del <select> y su valor es el id_ciudad
  const idCiudad = event.target.value;
  this.selectedCiudad = idCiudad; // Actualizamos el selectedCiudad
  if (idCiudad) {
    this.ubicacionService.getColonias(idCiudad).subscribe({
      next: data => this.colonias = data,
      error: err => console.error('Error al cargar colonias', err)
    });
  } else {
    this.colonias = [];
  }
}

cpEsValido: boolean = true; // Asumir true inicialmente si estás editando o hasta que se intente buscar

buscarPorCodigoPostal(): void {
  // Limpiar ubicaciones anteriores al inicio de la búsqueda
  this.colonias = [];
  this.selectedEstado = null;
  this.selectedCiudad = null;
  this.currentLote.nombre_colonia_nueva = null;
  this.currentLote.id_colonia = null;
  this.cpEsValido = false; // Asumir inválido hasta que se demuestre lo contrario

  if (this.codigoPostal && this.codigoPostal.length === 5) {
    this.ubicacionService.getCiudadPorCP(this.codigoPostal).subscribe({
      next: data => {
        if (data && data.id_ciudad) {
          // 🥇 Éxito: CP Válido y encontrado
          this.cpEsValido = true; 
          
          // Asignar estado y ciudad automáticamente
          this.selectedEstado = data.id_estado;
          this.selectedCiudad = data.id_ciudad;

          // Cargar ciudades del estado (sincronizando el dropdown)
          this.ubicacionService.getCiudades(data.id_estado).subscribe({
            next: ciudades => this.ciudades = ciudades,
          });

          // Usar colonias que vienen del CP
          this.colonias = data.colonias;
          
        } else {
          // ⚠️ Caso: El CP tiene 5 dígitos, pero el backend no lo encuentra (ej: 12345)
          this.handleCpNotFound();
        }
      },
      error: err => {
        // ❌ Caso: Error de API o de servidor
        console.error('Error al buscar por código postal', err);
        this.handleCpNotFound();
      }
    });
  } else if (!this.codigoPostal || this.codigoPostal.length !== 5) {
     // Caso: No tiene 5 dígitos o está vacío (se reinicia a inválido)
     this.handleCpNotFound();
  }
}

// Función auxiliar para manejar el caso de CP no encontrado o fallido
private handleCpNotFound(): void {
    this.cpEsValido = false;
    this.colonias = [];
    this.ciudades = []; // Limpiar la lista de ciudades
    this.selectedEstado = null;
    this.selectedCiudad = null;
    this.currentLote.nombre_colonia_nueva = null;
    this.currentLote.id_colonia = null;
    // Opcional: Podrías usar un Toast para notificar al usuario.
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

// === Notificaciones Toast ===
showToast(message: string, type: 'success' | 'danger' | 'warning' = 'success'): void {
    const toastEl = document.getElementById('liveToast');
    if (toastEl) {
      const bsToast = new bootstrap.Toast(toastEl);
      const body = toastEl.querySelector('.toast-body');
      const title = toastEl.querySelector('.toast-title');

      if (body) {
        body.innerHTML = message;
      }

      // Eliminar clases de color previas
      toastEl.className = toastEl.className.replace(/\btext-bg-\S+/g, '');

      // Agregar clases de color
      toastEl.classList.add(`text-bg-${type}`);

      if (title) {
        // Ajustar el título según el tipo de mensaje
        title.textContent = type === 'success' ? 'Éxito' : type === 'danger' ? 'Error' : 'Advertencia';
      }

      bsToast.show();
    }
}


  // === Scroll Buttons ===
@HostListener('window:scroll', [])
onWindowScroll() {
  if (this.isModalOpen) return; // No ejecutar si el modal está abierto

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