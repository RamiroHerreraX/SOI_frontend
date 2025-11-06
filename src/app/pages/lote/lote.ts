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
import Swal, { SweetAlertResult } from 'sweetalert2';


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
  //imagenesSeleccionadas: File[] = [];
  previewImagen: string | ArrayBuffer | null = null;

  

  //  NUEVAS PROPIEDADES PARA DOCUMENTACIÓN
  selectedDocumentacion: File | null = null;
  documentacionError: boolean = false;
  
  //  NUEVA PROPIEDAD PARA CONTROLAR EL ERROR DE ARCHIVO EN EL HTML
  fileError = false;
  previewImagenes: string[] = [];
  imagenesSeleccionadas: File[] = [];

  constructor(private loteService: LoteService, private ubicacionService: UbicacionService, private userService: UsersService) { }

  serviciosDisponibles = [
    'Luz',
    'Agua',
    'Drenaje',
    'Internet',
    'Teléfono',
    'Pavimentación',
    'Alumbrado público',
    'Recolección de basura'
  ];

    serviciosSeleccionados: string[] = [];

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
    this. imagenesSeleccionadas = []; 
    this.fileError = false; // 💡 Resetear error de archivo al abrir
    this.selectedEstado = null; // Reset para la validación
    this.selectedCiudad = null; // Reset para la validación
    this.imagenesSeleccionadas = [];
    this.previewImagenes = [];
    this.fileError = false;
    
    

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

  

      if (Array.isArray(lote.imagenes) && lote.imagenes.length > 0) {
    this.previewImagenes = lote.imagenes.map((imgPath: string) => 
      `http://localhost:3000${imgPath}`
    );
  } else if (lote.imagen) {
    // Compatibilidad con datos antiguos (solo una imagen)
    this.previewImagenes = [`http://localhost:3000${lote.imagen}`];
    this.previewImagen = lote.imagen
    ? `http://localhost:3000${lote.imagen}`
    : null;
  }

  // Reset selección de nuevas imágenes
  this.imagenesSeleccionadas = [];

  // 📄 --- CARGAR DOCUMENTACIÓN EXISTENTE ---
 // this.previewDocumentacion = lote.documentacion
 //   ? `http://localhost:3000${lote.documentacion}`
  //  : null;
  //this.selectedDocumentacion = null; // reset al editar

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

getImagenUrl(imagen: string): string {
  if (!imagen) return 'assets/default-lote.jpg';
  return `http://localhost:3000${imagen}`;
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



 // Maneja selección y deselección
onServicioChange(servicio: string, event: Event): void {
  const input = event.target as HTMLInputElement;
  if (input.checked) {
    if (!this.serviciosSeleccionados.includes(servicio)) {
      this.serviciosSeleccionados.push(servicio);
    }
  } else {
    this.serviciosSeleccionados = this.serviciosSeleccionados.filter(s => s !== servicio);
  }
}

// Llamar a esto al guardar el lote
guardarServiciosEnLote(): void {
  this.currentLote.servicios = [...this.serviciosSeleccionados];
  console.log('Servicios guardados:', this.currentLote.servicios);
}

// Llamar a esto cuando abras el modal para agregar un nuevo lote
resetServicios(): void {
  this.serviciosSeleccionados = [];
}


onFileSelected(event: any): void {
  const files: FileList = event.target.files;

  if (files && files.length > 0) {
    Array.from(files).forEach((file) => {
      // Validar que sea imagen
      if (!file.type.startsWith('image/')) {
        console.error("Tipo de archivo no válido. Solo se permiten imágenes.");
        this.fileError = true;
        return;
      }

      this.fileError = false;

      // Evitar duplicados (por nombre y tamaño)
      const yaExiste = this.imagenesSeleccionadas.some(
        (f) => f.name === file.name && f.size === file.size
      );
      if (yaExiste) return;

      // Agregar archivo
      this.imagenesSeleccionadas.push(file);

      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewImagenes.push(reader.result as string);
      };
      reader.readAsDataURL(file);
    });

    // limpiar el input file (para que permita volver a seleccionar el mismo archivo)
    event.target.value = '';
  }
}

addMoreImages(): void {
  const fileInput = document.querySelector('input[type="file"][style="display: none;"]') as HTMLInputElement;
  if (fileInput) fileInput.click();
}

// 🗑️ Quitar una imagen por índice
eliminarImagen(index: number) {
  this.imagenesSeleccionadas.splice(index, 1);
  this.previewImagenes.splice(index, 1);
}

// 🔄 Limpiar imágenes (por ejemplo al cerrar el modal)
resetearImagenes() {
  this.imagenesSeleccionadas = [];
  this.previewImagenes = [];
  this.fileError = false;
}

onDocumentacionSelected(event: any) {
    const file: File = event.target.files[0];
    
    // 1. Resetear el estado de error y la selección
    this.documentacionError = false; 
    this.selectedDocumentacion = null;

    if (file) {
      // 2. Validación: Chequear si el tipo de archivo es PDF
      if (file.type !== 'application/pdf') {
        console.error("Tipo de archivo no válido. Solo se permiten archivos PDF.");
        this.documentacionError = true; // Establecer error a true
        return;
      }

      // Si la validación pasa:
      this.selectedDocumentacion = file;
      this.showToast(`Archivo PDF "${file.name}" seleccionado.`, 'success');
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
        // 💡 NUEVA VALIDACIÓN PARA DOCUMENTACIÓN
        if (this.documentacionError) {
          this.showToast('No se puede guardar. Corrija el error del archivo de documentación (debe ser PDF).', 'danger');
          return;
        }

         // asegurarse que valores están en rango
          if (this.currentLote.precio < 1 || this.currentLote.precio > 100000000) {
            this.showToast('El precio debe estar entre 1 y 100,000,000.');
            return;
          }
          const camposEnteros = ['num_habitaciones','num_banos','num_estacionamientos'];
          for (const c of camposEnteros) {
            const v = Number(this.currentLote[c] ?? 0);
            if (v < 0 || v > 99) {
              this.showToast('Habitaciones/Baños/Estac. deben estar entre 0 y 99.');
              return;
            }
          }
          if (!/^\d{5}$/.test(this.codigoPostal ?? '')) {
            this.showToast('El código postal debe tener 5 dígitos.');
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

        //if (this. imagenesSeleccionadas) {
        //    formData.append('imagen', this. imagenesSeleccionadas);
        //}
        for (const file of this. imagenesSeleccionadas) {
          formData.append('imagenes', file); // 👈 mismo nombre que en el backend
        }

        // AGREGAR EL ARCHIVO PDF AL FORMDATA
        if (this.selectedDocumentacion) {
            formData.append('documentacion', this.selectedDocumentacion);
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
  this. imagenesSeleccionadas = [];  
  this.resetearImagenes();
  this.fileError = false; // 💡 Resetear error de archivo

  this.selectedDocumentacion = null;
  this.documentacionError = false;

// Cerrar modal después de un guardado exitoso
  const modalElement = document.getElementById('loteModal');
  if (modalElement) {
      const modal = bootstrap.Modal.getInstance(modalElement);
      if (modal) modal.hide();
  }
  this.onModalClose();
}


deleteLote(id: number): void {
 Swal.fire({
    title: '¿Seguro que quieres eliminar este lote?',
    text: 'Esta acción no se puede deshacer.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  }).then((result: SweetAlertResult) => {
    if (result.isConfirmed) {
      this.loteService.delete(id).subscribe({
        next: () => {
          this.loadLotes();
          this.showToast('Lote eliminado correctamente.', 'success');
        },
        error: err => this.showToast('Error al eliminar lote: ' + err.error?.error, 'danger')
      });
    }
  });

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



// Recorta y fuerza el valor al rango, además de limitar los dígitos.
clampValue(obj: any, prop: string, min: number, max: number, event: Event, maxDigits?: number) {
  const input = event.target as HTMLInputElement;
  let raw = input.value?.toString() ?? '';

  // Eliminar todo lo que no sea dígito o signo negativo (si aplica)
  raw = raw.replace(/[^\d-]/g, '');

  // Limitar número de dígitos si se indicó
  if (maxDigits && raw.length > maxDigits) {
    raw = raw.slice(0, maxDigits);
  }

  let n = parseInt(raw, 10);
  if (isNaN(n)) {
    obj[prop] = raw === '' ? null : obj[prop];
    input.value = raw;
    return;
  }

  if (n < min) n = min;
  if (n > max) n = max;

  obj[prop] = n;
  input.value = String(n);
}


// Maneja pegar en campos numéricos: evita valores fuera de rango o no numéricos
onPasteNumber(event: ClipboardEvent, min: number, max: number) {
  const pasted = (event.clipboardData?.getData('text') ?? '').replace(/[^\d-]/g, '');
  const n = parseInt(pasted, 10);
  if (isNaN(n) || n < min || n > max) {
    event.preventDefault(); // evita pegar si no es válido
  }
}

// Código postal: dejar sólo dígitos, máximo 5, sincroniza modelo y input
onCpInput(event: Event) {
  const input = event.target as HTMLInputElement;
  let raw = (input.value ?? '').replace(/\D/g, '').slice(0, 5);
  input.value = raw;
  this.codigoPostal = raw;
  // actualizar validación de CP que ya tienes (cpEsValido) si usas búsqueda
  if (raw.length === 5) {
    this.buscarPorCodigoPostal(); // tu función ya existente
  } else {
    this.cpEsValido = false; // o la lógica que uses
  }
}

// Pegar en CP: limpiar y limitar a 5 dígitos
onCpPaste(event: ClipboardEvent) {
  const pasted = (event.clipboardData?.getData('text') ?? '').replace(/\D/g, '').slice(0,5);
  if (!pasted) { event.preventDefault(); return; }
  // reemplaza el portapapeles en el campo (mejor manejar en next tick)
  const input = event.target as HTMLInputElement;
  setTimeout(() => {
    input.value = pasted;
    this.codigoPostal = pasted;
    if (pasted.length === 5) this.buscarPorCodigoPostal();
  }, 0);
}


}