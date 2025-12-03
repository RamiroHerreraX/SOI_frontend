import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ContratoService } from '../../../services/contrato.service';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { FooterAdmin } from "../../../shared/footer-admin/footer-admin";
import { HeaderAdmin } from "../../../shared/header-admin/header-admin";
import { AlignmentType, Document, Footer, Header, HeadingLevel, ImageRun, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from 'file-saver';
import pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { RouterLink } from "@angular/router";
import { ScrollTopComponent } from "../../scroll-top/scroll-top.component";
(pdfMake as any).vfs = (pdfFonts as any).vfs;


@Component({
  selector: 'app-crear-contrato',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    FooterAdmin,
    HeaderAdmin,
    RouterLink,
    ScrollTopComponent
],
  templateUrl: './crear-contrato.component.html',
  styleUrl: './crear-contrato.component.css'
})
export class CrearContratoComponent {
  contratoForm: FormGroup;
  enviando = false;
  loteSeleccionado: any = null;
  currentStep: number = 1;
  totalSteps: number = 6;


  constructor(
    private fb: FormBuilder,
    private contratoService: ContratoService,
  ) {
    this.contratoForm = this.fb.group({
      id_lote: ['', [Validators.required, Validators.pattern(/^[0-9]+$/), Validators.maxLength(15)]],
      correo_cliente: ['', [Validators.required, Validators.email, Validators.maxLength(30)]],
      nombre: [''],
      apellido_paterno: [''],
      apellido_materno: [''],
      telefono: [''],
      precio_total: ['', [Validators.required, Validators.min(1), Validators.pattern(/^[0-9]+(\.[0-9]+)?$/), Validators.maxLength(10)]],
      enganche: ['', [Validators.required, Validators.min(0), Validators.pattern(/^[0-9]+(\.[0-9]+)?$/), Validators.maxLength(10)]],
      plazo_meses: ['', [Validators.required, Validators.min(1),  Validators.max(12), Validators.pattern(/^[0-9]+$/)]],
      estado_contrato: ['activo'],
      propietario_nombre: [''],
      id_cliente: [null],
      nombre_predio: ['', [Validators.required, Validators.minLength(3), Validators.pattern(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$/), Validators.maxLength(20)]],
      tipo_documento: ['', [Validators.required, Validators.pattern(/^[A-Za-zÁÉÍÓÚÜÑ ]+$/), Validators.maxLength(30)]],
      folio_escritura: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(11)]],
      fecha_emision: ['', [Validators.required, this.validarFechaNoFutura]],
      registro_publico: ['',  [Validators.required, Validators.minLength(5), Validators.maxLength(30)]],
      colindancia_norte: ['', [Validators.required, Validators.minLength(3),Validators.maxLength(30)]],
      colindancia_sur: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30)]],
      colindancia_este: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30)]],
      colindancia_oeste: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30)]],
      medida_norte: ['', [Validators.required, Validators.pattern(/^\d+(\.\d+)?$/), Validators.maxLength(15)]],
      medida_sur: ['', [Validators.required, Validators.pattern(/^\d+(\.\d+)?$/), Validators.maxLength(15)]],
      medida_este: ['', [Validators.required, Validators.pattern(/^\d+(\.\d+)?$/), Validators.maxLength(15)]],
      medida_oeste: ['', [Validators.required, Validators.pattern(/^\d+(\.\d+)?$/), Validators.maxLength(15)]],
      ciudadFirma: ['',  [Validators.required, Validators.maxLength(30),Validators.pattern(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/)]],
      fecha_firma: ['', [Validators.required ]],
      fecha_registro_publico: ['', [Validators.required,  this.validarFechaNoFutura]],
    },
    {
    validators: this.validarEngancheMenorQuePrecio(), updateOn: 'change'
});


    this.contratoForm.get('correo_cliente')?.valueChanges.subscribe(correo => {
    if (correo && this.contratoForm.get('correo_cliente')?.valid) {
      this.contratoService.buscarClientePorCorreo(correo).subscribe({
        next: (cliente) => {
          this.contratoForm.patchValue({
            nombre: cliente.nombre,
            apellido_paterno: cliente.apellido_paterno,
            apellido_materno: cliente.apellido_materno,
            telefono: cliente.telefono,
            id_cliente: cliente.id_cliente
          });

          this.loteSeleccionado = {
            ...this.loteSeleccionado,
            id_cliente: cliente.id_cliente
          };

          // Los ponemos solo lectura
          this.contratoForm.get('nombre')?.disable();
          this.contratoForm.get('apellido_paterno')?.disable();
          this.contratoForm.get('apellido_materno')?.disable();
          this.contratoForm.get('telefono')?.disable();
        },
        error: () => {
          this.contratoForm.get('nombre')?.enable();
          this.contratoForm.get('apellido_paterno')?.enable();
          this.contratoForm.get('apellido_materno')?.enable();
          this.contratoForm.get('telefono')?.enable();

          this.contratoForm.patchValue({
            nombre: '',
            apellido_paterno: '',
            apellido_materno: '',
            telefono: ''
          });
          this.contratoForm.get('correo_cliente')?.setErrors({ correoNoExiste: true });
        }
      });
    }
  });

    this.contratoForm.get('id_lote')?.valueChanges.subscribe(() => {
    this.obtenerLoteParaContrato();
  });

}

/**
 * Cambia el paso actual de la navegación.
 * Verifica que el paso anterior esté completo o validado antes de avanzar.
 * @param step El número del paso al que se quiere ir.
 */
// ... (Dentro de la clase CrearContratoComponent)

  // Método para ir a un paso específico (siempre se permite ir hacia atrás)
  goToStep(step: number): void {
    if (step >= 1 && step <= this.totalSteps) {
      // Si el usuario está intentando ir al siguiente paso (step > this.currentStep),
      // verificamos si el paso actual es válido.
      if (step > this.currentStep) {
        if (this.isCurrentStepValid(this.currentStep)) {
          this.currentStep = step;
        } else {
          // Marca los campos del paso actual como 'touched' para mostrar errores
          this.markFormGroupTouched(this.getFormGroupForStep(this.currentStep));
          Swal.fire('Error de Validación', 'Por favor, complete todos los campos obligatorios del paso actual antes de avanzar.', 'warning');
        }
      } else {
        // Permitir ir hacia atrás sin validación
        this.currentStep = step;
      }
    }
  }

  // Método auxiliar para obtener el subconjunto de controles para cada paso
  getFormGroupForStep(step: number): AbstractControl {
    switch (step) {
      case 1:
        return this.fb.group({
          id_lote: this.contratoForm.get('id_lote'),
        });
      case 2:
        return this.fb.group({
          correo_cliente: this.contratoForm.get('correo_cliente'),
        });
      case 3:
        return this.fb.group({
          enganche: this.contratoForm.get('enganche'),
          plazo_meses: this.contratoForm.get('plazo_meses'),
        });
      case 4:
        return this.fb.group({
          nombre_predio: this.contratoForm.get('nombre_predio'),
          tipo_documento: this.contratoForm.get('tipo_documento'),
          folio_escritura: this.contratoForm.get('folio_escritura'),
          fecha_emision: this.contratoForm.get('fecha_emision'),
          registro_publico: this.contratoForm.get('registro_publico'),
          fecha_registro_publico: this.contratoForm.get('fecha_registro_publico'),
        });
      case 5: // ✨ NUEVO PASO 5: Colindancias y Medidas
        return this.fb.group({
          colindancia_norte: this.contratoForm.get('colindancia_norte'),
          colindancia_sur: this.contratoForm.get('colindancia_sur'),
          colindancia_este: this.contratoForm.get('colindancia_este'),
          colindancia_oeste: this.contratoForm.get('colindancia_oeste'),
          medida_norte: this.contratoForm.get('medida_norte'),
          medida_sur: this.contratoForm.get('medida_sur'),
          medida_este: this.contratoForm.get('medida_este'),
          medida_oeste: this.contratoForm.get('medida_oeste'),
        });
      case 6: // ✨ NUEVO PASO 6: Firma
        return this.fb.group({
          ciudadFirma: this.contratoForm.get('ciudadFirma'),
          fecha_firma: this.contratoForm.get('fecha_firma'),
        });
      default:
        return this.contratoForm; // Por defecto o si hay error
    }
  }

  // Método para validar el paso actual
  isCurrentStepValid(step: number): boolean {
    const stepGroup = this.getFormGroupForStep(step);
    // Para el paso 1, también verifica si se ha seleccionado un lote.
    if (step === 1) {
        return stepGroup.valid && this.loteSeleccionado !== null;
    }
    // Para el paso 2, también verifica si se han cargado los datos del cliente.
    if (step === 2) {
        return stepGroup.valid && this.contratoForm.get('nombre')?.value && this.contratoForm.get('id_cliente')?.value !== null;
    }
    return stepGroup.valid;
  }
  
  // Método recursivo para marcar todos los campos de un grupo de formulario como 'touched'
  markFormGroupTouched(control: AbstractControl) {
    if (control instanceof FormGroup) {
      Object.values(control.controls).forEach(c => {
        this.markFormGroupTouched(c);
      });
    } else {
      control.markAsTouched();
    }
  }

validarEngancheMenorQuePrecio() {
  return (form: FormGroup) => {
    const precio = form.get('precio_total')?.value;
    const enganche = form.get('enganche')?.value;

    if (precio && enganche && parseFloat(enganche) > parseFloat(precio)) {
      form.get('enganche')?.setErrors({ engancheMayor: true });
    } else {
      const errors = form.get('enganche')?.errors;
      if (errors) {
        delete errors['engancheMayor'];
        if (Object.keys(errors).length === 0) {
          form.get('enganche')?.setErrors(null);
        }
      }
    }
  };
}

soloNumerosDecimales(event: KeyboardEvent) {
  const regex = /^[0-9.]$/;
  const input = event.key;

  // Bloquear letras
  if (!regex.test(input)) {
    event.preventDefault();
    return;
  }

  // Evitar más de un punto decimal
  const currentValue = (event.target as HTMLInputElement).value;
  if (input === '.' && currentValue.includes('.')) {
    event.preventDefault();
  }
}

limitarMax(event: any, max: number) {
  if (event.target.value.length > max) {
    event.target.value = event.target.value.slice(0, max);
  }
}



  onSubmit() {
    // Solo permitir enviar si estamos en el último paso y el formulario es válido
    if (this.currentStep !== this.totalSteps) {
      Swal.fire('Flujo incompleto', 'Debes completar el paso final del contrato antes de enviarlo.', 'warning');
      return;
    }
    
    // Aquí el check de validez debe ser global, ya que incluye todos los campos necesarios para el PDF.
    // Además, aseguramos que los campos deshabilitados (del cliente) son ignorados si no están en el payload.
    // Para la validación global, habilitamos temporalmente los campos de cliente para que se validen los vacíos si es necesario.
    
    // Habilitar temporalmente los campos de cliente para la validación de envío si son requeridos
    // Nota: En tu formulario, nombre, apellido, y teléfono no tienen `Validators.required`
    const nombreControl = this.contratoForm.get('nombre');
    if (nombreControl?.disabled) {
      nombreControl.enable();
    }
    
    if (this.contratoForm.invalid) {
      Swal.fire('Campos incompletos', 'Por favor completa todos los campos requeridos en el Paso 4.', 'warning');
      
      // Volver a deshabilitar si estaban deshabilitados
      if (this.contratoForm.get('id_cliente')?.value !== null) {
        nombreControl?.disable();
      }
      return;
    }

    if (this.loteSeleccionado && this.loteSeleccionado.estado_propiedad !== 'disponible') {
    Swal.fire('Lote no disponible', 'No puedes crear un contrato porque el lote no está disponible.', 'error');
    return;
  }

    this.enviando = true;

    // Se recomienda construir el payload solo con los campos que la API espera.
    const payload = {
      id_lote: this.contratoForm.get('id_lote')?.value,
      precio_total: this.contratoForm.get('precio_total')?.value,
      enganche: this.contratoForm.get('enganche')?.value,
      plazo_meses: this.contratoForm.get('plazo_meses')?.value,
      estado_contrato: this.contratoForm.get('estado_contrato')?.value,
      propietario_nombre: this.contratoForm.get('propietario_nombre')?.value,
      id_cliente: this.contratoForm.get('id_cliente')?.value
    };


    this.contratoService.crearContrato(payload).subscribe({
      next: (res) => {
        Swal.fire('Contrato creado', 'El contrato se registró exitosamente y se generará el PDF.', 'success');
        this.generarPDFContrato();
      },
      error: (err) => {
        Swal.fire('Error', err.error?.message || 'No se pudo crear el contrato', 'error');
      },
      complete: () => {
        this.enviando = false;
        // Volver a deshabilitar los campos de cliente después del envío
        if (this.contratoForm.get('id_cliente')?.value !== null) {
          this.contratoForm.get('nombre')?.disable();
          this.contratoForm.get('apellido_paterno')?.disable();
          this.contratoForm.get('apellido_materno')?.disable();
          this.contratoForm.get('telefono')?.disable();
        }
      }
    });
  }
  
  evitarNotacion(event: KeyboardEvent) {
  if (["e", "E", "+", "-"].includes(event.key)) {
    event.preventDefault();
  }
}

  validarFechaNoFutura(control: AbstractControl) {
  const fecha = new Date(control.value);
  const hoy = new Date();

  // Comprobar solo la fecha, ignorando la hora
  if (fecha.setHours(0, 0, 0, 0) > hoy.setHours(0, 0, 0, 0)) {
    return { fechaFutura: true };
  }
  return null;
}

  obtenerLoteParaContrato() {
  const idLote = this.contratoForm.get('id_lote')?.value;

  if (!idLote) return;

  this.contratoService.obtenerLoteParaContrato(idLote).subscribe({
    next: (resp) => {
      this.loteSeleccionado = resp.lote;

      this.contratoForm.patchValue({
      precio_total: resp.lote.precio,
      propietario_nombre: resp.lote.propietario_nombre
    });

      // 🔹 Validar si el lote ya está vendido
      if (this.loteSeleccionado.estado_propiedad !== 'disponible') {
        Swal.fire(
          'Lote no disponible',
          'Este lote no está disponible. Puede estar rentado, vendido o en proceso.',
          'error'
        );

        this.contratoForm.get('id_lote')?.setErrors({ loteNoDisponible: true });
      } else {
        // Si está disponible, limpiar error
        this.contratoForm.get('id_lote')?.setErrors(null);
      }
    },
    error: (err) => {
      this.loteSeleccionado = null;
      this.contratoForm.get('id_lote')?.setErrors({ loteNoExiste: true });
    }
  });
}


async convertBase64ToUint8(path: string): Promise<Uint8Array> {
  const res = await fetch(path);
  const blob = await res.blob();
  return new Uint8Array(await blob.arrayBuffer());
}


convertToBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = url;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);

      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => reject('Error al cargar la imagen');
  });
}

numeroALetras(num: number): string {
  const unidades = ['','UNO','DOS','TRES','CUATRO','CINCO','SEIS','SIETE','OCHO','NUEVE'];
  const decenas = ['','DIEZ','VEINTE','TREINTA','CUARENTA','CINCUENTA','SESENTA','SETENTA','OCHENTA','NOVENTA'];
  const especiales = ['ONCE','DOCE','TRECE','CATORCE','QUINCE','DIECISÉIS','DIECISIETE','DIECIOCHO','DIECINUEVE'];
  const centenas = ['','CIENTO','DOSCIENTOS','TRESCIENTOS','CUATROCIENTOS','QUINIENTOS','SEISCIENTOS','SETECIENTOS','OCHOCIENTOS','NOVECIENTOS'];

  if (num === 0) return 'CERO';
  if (num === 100) return 'CIEN';

  let letras = '';

  if (num >= 1000) {
    const miles = Math.floor(num / 1000);
    letras += (miles === 1 ? 'MIL' : this.numeroALetras(miles) + ' MIL') + ' ';
    num = num % 1000;
  }

  if (num >= 100) {
    const c = Math.floor(num / 100);
    letras += centenas[c] + ' ';
    num = num % 100;
  }

  if (num >= 20) {
    const d = Math.floor(num / 10);
    letras += decenas[d] + (num % 10 > 0 ? ' Y ' + unidades[num % 10] : '');
  } else if (num > 10 && num < 20) {
    letras += especiales[num - 11];
  } else if (num === 10) {
    letras += 'DIEZ';
  } else if (num > 0 && num < 10) {
    letras += unidades[num];
  }

  return letras.trim();
}

// Función para convertir números a letras en mayúsculas
numeroALetrasMayus(num: number): string {
  const unidades = ['','UNO','DOS','TRES','CUATRO','CINCO','SEIS','SIETE','OCHO','NUEVE'];
  const decenas = ['','DIEZ','VEINTE','TREINTA','CUARENTA','CINCUENTA','SESENTA','SETENTA','OCHENTA','NOVENTA'];
  const especiales = ['ONCE','DOCE','TRECE','CATORCE','QUINCE','DIECISÉIS','DIECISIETE','DIECIOCHO','DIECINUEVE'];
  const centenas = ['','CIENTO','DOSCIENTOS','TRESCIENTOS','CUATROCIENTOS','QUINIENTOS','SEISCIENTOS','SETECIENTOS','OCHOCIENTOS','NOVECIENTOS'];

  if (num === 0) return 'CERO';
  if (num === 100) return 'CIEN';

  let letras = '';

  if (num >= 1000) {
    const miles = Math.floor(num / 1000);
    letras += (miles === 1 ? 'MIL' : this.numeroALetrasMayus(miles) + ' MIL') + ' ';
    num = num % 1000;
  }

  if (num >= 100) {
    const c = Math.floor(num / 100);
    letras += centenas[c] + ' ';
    num = num % 100;
  }

  if (num >= 20) {
    const d = Math.floor(num / 10);
    letras += decenas[d] + (num % 10 > 0 ? ' Y ' + unidades[num % 10] : '');
  } else if (num > 10 && num < 20) {
    letras += especiales[num - 11];
  } else if (num === 10) {
    letras += 'DIEZ';
  } else if (num > 0 && num < 10) {
    letras += unidades[num];
  }

  return letras.trim();
}

// Función principal para formatear la fecha
fechaALetras(fecha: string | Date): string {
  const dateObj = new Date(fecha);
  const dia = dateObj.getDate();
  const mes = dateObj.getMonth(); // 0-11
  const anio = dateObj.getFullYear();

  const meses = [
    'ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO',
    'JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'
  ];

  const diaLetras = this.numeroALetrasMayus(dia);
  const anioMiles = this.numeroALetrasMayus(anio); // Esto devuelve todo el año en letras

  return `A LOS ${dia} ${diaLetras} DÍAS DEL MES DE ${meses[mes]} DEL AÑO ${anio} ${anioMiles}`;
}

numeroALetrasPrecio(num: number): string {

  const unidades = ['CERO','UNO','DOS','TRES','CUATRO','CINCO','SEIS','SIETE','OCHO','NUEVE'];
  const especiales = ['ONCE','DOCE','TRECE','CATORCE','QUINCE','DIECISÉIS','DIECISIETE','DIECIOCHO','DIECINUEVE'];
  const decenas = ['DIEZ','VEINTE','TREINTA','CUARENTA','CINCUENTA','SESENTA','SETENTA','OCHENTA','NOVENTA'];
  const centenas = ['CIEN','CIENTO','DOSCIENTOS','TRESCIENTOS','CUATROCIENTOS','QUINIENTOS','SEISCIENTOS','SETECIENTOS','OCHOCIENTOS','NOVECIENTOS'];

  const convertir = (n: number): string => {
    if (n === 0) return '';

    if (n < 10) return unidades[n];
    if (n === 10) return 'DIEZ';
    if (n > 10 && n < 20) return especiales[n - 11];
    if (n < 100) {
      const d = Math.floor(n / 10);
      const r = n % 10;
      return decenas[d - 1] + (r > 0 ? ' Y ' + unidades[r] : '');
    }
    if (n < 1000) {
      if (n === 100) return 'CIEN';
      const c = Math.floor(n / 100);
      return centenas[c] + ' ' + convertir(n % 100);
    }
    if (n < 1000000) {
      const m = Math.floor(n / 1000);
      return (m === 1 ? 'MIL' : convertir(m) + ' MIL') + ' ' + convertir(n % 1000);
    }
    if (n < 1000000000000) {
      const mi = Math.floor(n / 1000000);
      return (mi === 1 ? 'UN MILLÓN' : convertir(mi) + ' MILLONES') + ' ' + convertir(n % 1000000);
    }

    return '';
  };

  // Separar parte entera y centavos
  const parteEntera = Math.floor(num);
  const parteDecimal = Math.round((num - parteEntera) * 100);

  let texto = convertir(parteEntera).trim();

  if (texto === '') texto = 'CERO';

  // Ajustar “UNO” → “UN”
  texto = texto.replace(/ UNO(?= MIL| MILL|$)/g, ' UN');

  if (parteDecimal > 0) {
    texto += ` PESOS ${convertir(parteDecimal)} CENTAVOS`;
  } else {
    texto += ' PESOS 00/100 M.N.';
  }

  return texto.trim();
}



async generarPDFContrato() {

  const toUpper = (value: string | number | null | undefined): string => {
        if (typeof value === 'string') {
          return value.toUpperCase();
        }
        if (typeof value === 'number') {
          return String(value);
        }
        return ''; // Retorna cadena vacía si es null/undefined
      };

  console.log("FORM VALID?", this.contratoForm.valid);
  console.log("FORM ERRORS:", this.contratoForm.errors);

  Object.keys(this.contratoForm.controls).forEach(key => {
    const control = this.contratoForm.get(key);
    if (control?.invalid) {
      console.warn("❌ Campo inválido:", key, control.errors);
    }
  });  

  // Asegurar que los campos deshabilitados (cliente) se validen si son requeridos para el PDF
  const nombreControl = this.contratoForm.get('nombre');
  const apellidoPaternoControl = this.contratoForm.get('apellido_paterno');
  const apellidoMaternoControl = this.contratoForm.get('apellido_materno');

  if (nombreControl?.disabled) nombreControl.enable();
  if (apellidoPaternoControl?.disabled) apellidoPaternoControl.enable();
  if (apellidoMaternoControl?.disabled) apellidoMaternoControl.enable();


  if (!this.loteSeleccionado || this.contratoForm.invalid) {
    Swal.fire('Error', 'Debes completar todos los datos requeridos del contrato antes de generar el PDF.', 'warning');
    
    // Volver a deshabilitar si corresponde
    if (this.contratoForm.get('id_cliente')?.value !== null) {
      nombreControl?.disable();
      apellidoPaternoControl?.disable();
      apellidoMaternoControl?.disable();
    }
    return;
  }
  
  // Volver a deshabilitar si corresponde antes de continuar la generación
  if (this.contratoForm.get('id_cliente')?.value !== null) {
    nombreControl?.disable();
    apellidoPaternoControl?.disable();
    apellidoMaternoControl?.disable();
  }


  const fechaHoy = new Date();
  const meses = [
      "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
      "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"
  ];
  const dia = fechaHoy.getDate();
  const mes = meses[fechaHoy.getMonth()];
  const anio = fechaHoy.getFullYear();

  // NOTA: Asumiendo que 'convertToBase64' y la imagen 'hoja' funcionan para el fondo.
  const base64 = await this.convertToBase64('assets/hoja_membretada.png');
  const nombreVendedor = toUpper(this.loteSeleccionado.propietario_nombre);
  const nombreComprador = toUpper(`${this.contratoForm.get('nombre')?.value} ${this.contratoForm.get('apellido_paterno')?.value} ${this.contratoForm.get('apellido_materno')?.value}`);
  const nombrePredio = toUpper(this.contratoForm.value.nombre_predio);
  const ubicacionCompleta = `${this.loteSeleccionado.direccion}, ${this.loteSeleccionado.nombre_ciudad}, ${this.loteSeleccionado.nombre_estado}`;
  const colonia = toUpper(`${this.loteSeleccionado.nombre_colonia}`);
  const ciudad = toUpper(`${this.loteSeleccionado.nombre_ciudad}`);
  const numLote = `${this.loteSeleccionado.numlote}`
  const manzana = `${this.loteSeleccionado.manzana}`
  const tipoDocumento = toUpper(this.contratoForm.value.tipo_documento);
  const folioEscritura = this.contratoForm.value.folio_escritura;
  const fechaEmision = this.contratoForm.value.fecha_emision;
  const registroPublico = toUpper(this.contratoForm.value.registro_publico);

  const colNorte = toUpper(this.contratoForm.value.colindancia_norte);
  const colSur = toUpper(this.contratoForm.value.colindancia_sur);
  const colEste = toUpper(this.contratoForm.value.colindancia_este);
  const colOeste = toUpper(this.contratoForm.value.colindancia_oeste);
  const medNorte = toUpper(this.contratoForm.value.medida_norte);
  const medSur = toUpper(this.contratoForm.value.medida_sur);
  const medEste = toUpper(this.contratoForm.value.medida_este);
  const medOeste = toUpper(this.contratoForm.value.medida_oeste);
  const precioTotal = this.contratoForm.get('precio_total')?.value;
  const ciudadFirma = toUpper(this.contratoForm.value.ciudadFirma);
  const fechaFirma = this.contratoForm.value.fecha_firma;
  const fechaRegistro = this.contratoForm.value.fecha_registro_publico;


  const folioEscrituraLetras = this.numeroALetrasMayus(folioEscritura);
  const fechaEmisionLetras = this.fechaALetras(fechaEmision);
  const precioLetras = this.numeroALetrasPrecio(precioTotal);
  const fechaFirmaLetras = this.fechaALetras(fechaFirma);
  const fechaRegistroLetras = this.fechaALetras(fechaRegistro);



  const documentDefinition: any = {
    // Márgenes ajustados para el fondo del membrete
    pageMargins: [40, 120, 40, 65], 

    defaultStyle: {
      fontSize: 10,
      alignment: 'justify' // Justificar todo el texto del cuerpo
    },

    background: [
      {
        image: 'hoja',
        width: 595,
        height: 842,
        alignment: 'center',
      }
    ],

    images: {
      hoja: base64
    },

    content: [
      // Título
      {
        text: 'CONTRATO PRIVADO DE COMPRAVENTA',
        style: 'titulo',
        alignment: 'center',
        margin: [0, 0, 0, 10]
      },

      // Introducción con formato de negritas como en la imagen
      {
        "lineHeight": 1.3,
        text: [
          `EN LA CIUDAD DE SAN LUIS DE LA PAZ, GTO, A LOS ${dia} DÍAS DEL MES DE ${mes} DEL AÑO ${anio}, SE LLEVA A CABO EL PRESENTE CONTRATO PRIVADO DE COMPRA-VENTA, QUE CELEBRAN POR UNA PARTE Y POR SU PROPIO DERECHO EL C. `,
          { text: `${nombreVendedor}, `, bold: true, color: '#000000' },
          `A QUIEN EN LO SUCESIVO SE LE DENOMINARÁ COMO LA PARTE VENDEDORA Y DE LA OTRA PARTE TAMBIÉN POR SU PROPIO DERECHO A `,
          { text: `${nombreComprador}, `, bold: true, color: '#000000' },
          `A QUIEN EN LO SUCESIVO SE LE DENOMINARÁ COMO LA PARTE COMPRADORA, QUIENES SE SUJETAN AL TENOR DE LOS SIGUIENTES ANTECEDENTES Y CLÁUSULAS.`,
        ],
        margin: [0, 0, 0, 25]
      },

      // Sección ANTECEDENTES (Con líneas de separación)
      {
        canvas: [{ type: 'line', x1: 0, y1: 0, x2: 520, y2: 0, lineWidth: 0.5 }],
        margin: [0, 10, 0, 5]
      },
      { text: 'A N T E C E D E N T E S', style: 'sectionTitle' },
      {
        canvas: [{ type: 'line', x1: 0, y1: 0, x2: 520, y2: 0, lineWidth: 0.5 }],
        margin: [0, 5, 0, 25]
      },

      // ANTECEDENTE PRIMERO (Formato justificado y combinado)
      {
        "leadingIndent": 36,
        "lineHeight": 1.3,
        text: [
          { text: ' PRIMERO.-', bold: true, color: '#000000'},
          `MANIFIESTA EL C. `,
          { text: `${nombreVendedor} `, bold: true },
          `SER DUEÑO Y POSEEDOR DE UN PREDIO RÚSTICO O URBANO DENOMINADO COMO `,
          { text: `${nombrePredio}, `, bold: true },
          `UBICADO EN LA LOCALIDAD ${colonia} PERTENECIENTE AL MUNICIPIO DE ${ciudad}, GTO, QUIEN ACREDITA LA PROPIEDAD CON LA ${tipoDocumento} CON PARTIDA NÚMERO ${folioEscritura} (${folioEscrituraLetras}), QUE SE EXPIDE EN LA CIUDAD DE SAN LUIS DE LA PAZ, ESTADO DE GUANAJUATO A LOS ${fechaEmisionLetras}, Y QUE SE ENCUENTRA INSCRITA EN EL REGISTRO PÚBLICO DE LA PROPIEDAD CON FOLIOS ELECTRÓNICOS ${registroPublico}. CON FECHA ${fechaRegistroLetras} EL CUAL VENDE LA SIGUIENTE FRACCIÓN`
        ],
        margin: [0, 0, 0, 25]
      },
      // Medidas y colindancias (Usando UL para la sangría, pero con estilo más sobrio)
      // Colindancias con formato de la segunda imagen
{
    // Lotes y Manzana (Se mantiene sin cambios, pero es el párrafo que va antes)
    text: `LOTES NO. ${numLote} MANZANA ${manzana}`,
    bold: true,
    color: '#000000',
    margin: [0, 0, 0, 12]
},

// Bloque de Colindancias sin usar UL
{
    // Aplicamos una sangría izquierda general (e.g., 50 puntos) al todo el bloque.
    // [izquierda, arriba, derecha, abajo]
    margin: [0, 0, 0, 25],
    "lineHeight": 2.0,
    stack: [
        {
            text: [
                { text: 'AL NORTE:', bold: true },
                ` ${medNorte} M. Y LINDA CON ${colNorte}`
            ]
        },
        {
            text: [
                { text: 'AL SUR:', bold: true },
                ` ${medSur} M. Y LINDA CON ${colSur}`
            ]
        },
        {
            text: [
                { text: 'AL ORIENTE:', bold: true },
                ` ${medEste} M. Y LINDA CON ${colEste}`
            ]
        },
        {
            text: [
                { text: 'AL PONIENTE:', bold: true },
                ` ${medOeste} M. Y LINDA CON ${colOeste}`
            ]
        },
    ]
},

      // ANTECEDENTE SEGUNDO
      {
        "leadingIndent": 36,
        "lineHeight": 1.3,
        text: [
          { text: 'SEGUNDO.- ', bold: true, color: '#000000' },
          `POR ÚLTIMO, MANIFIESTA EL C.`,
          { text: `${nombreVendedor}, `, bold: true, color: '#000000' },
            `QUE POR CONVENIR A SUS INTERESES HA DECIDIDO VENDER LA TOTALIDAD DEL PREDIO DESCRITO EN EL ANTECEDENTE PRIMERO A C.`,
          { text: `${nombreComprador} `, bold: true, color: '#000000' },
          `COMPRAVENTA QUE SE REALIZA SEGÚN EL PRECIO, TERMINO Y DEMÁS CONDICIONES QUE SE ESTIPULAN EN LAS CLAUSULAS DEL PRESENTE CONTRATO.`
        ],
        margin: [0, 0, 0, 95]
      },

      // Sección CLÁUSULAS (Con líneas de separación)
      {
        canvas: [{ type: 'line', x1: 0, y1: 0, x2: 520, y2: 0, lineWidth: 0.5 }],
        margin: [0, 10, 0, 5]
      },
      { text: 'C L Á U S U L A S', style: 'sectionTitle' },
      {
        canvas: [{ type: 'line', x1: 0, y1: 0, x2: 520, y2: 0, lineWidth: 0.5 }],
        margin: [0, 5, 0, 20]
      },

      // CLÁUSULAS (Estructura de texto combinado)
      {
        "leadingIndent": 36,
        "lineHeight": 1.3,
        text: [
          { text: 'PRIMERA.- ', bold: true, color: '#000000' },
          `EL C.`,
          { text: `${nombreVendedor}, `, bold: true, color: '#000000' },
          `POR SU PROPIO DERECHO VENDE EL PREDIO DESCRITO EN EL ANTECEDENTE PRIMERO DE ESTE CONTRATO DE COMPRAVENTA CON LA SUPERFICE, MEDIDAS Y COLINDANCIAS QUE SE DAN AQUÍ POR REPRODUCIDAS, Y LA C. `,
          { text: `${nombreComprador} `, bold: true, color: '#000000' },
            `, ADQUIERE DICHA FRACOÓN DEL INMUEBLE MATERIA DEL PRESENTE CONTRATO.`
        ],
        margin: [0, 0, 0, 5]
      },
      {
        "canvas": [{ "type": 'line', "x1": 0, "y1": 0, "x2": 520, "y2": 0, "lineWidth": 0.5, "dash": { "length": 5, "space": 2 } }],
        "margin": [0, 5, 0, 15] // Espacio entre la línea y la siguiente cláusula
      },
      {
        "leadingIndent": 36,
        "lineHeight": 1.3,
        text: [
          { text: 'SEGUNDA.- ', bold: true, color: '#000000' },
          ` CONVIENEN LAS PARTES QUE EL PRECIO TOTAL DE LA PRESENTE OPERACIÓN DE COMPRAVENTA, ES LA CANTIDAD DE $ ${precioTotal} (${precioLetras}) CANTIDAD QUE EL COMPRADOR `,
          { text: `${nombreComprador}, `, bold: true, color: '#000000' },
          `SE OBLIGA A PAGAR AL VENDEDOR EL C. `,
          { text: `${nombreVendedor}, `, bold: true, color: '#000000' },
          `A PARTIR DE LA FIRMA DE ESTE CONTRATO DE COMPRAVENTA.`,


        ],
        margin: [0, 0, 0, 5]
      },
      {
        "canvas": [{ "type": 'line', "x1": 0, "y1": 0, "x2": 520, "y2": 0, "lineWidth": 0.5, "dash": { "length": 5, "space": 2 } }],
        "margin": [0, 5, 0, 15] // Espacio entre la línea y la siguiente cláusula
      },
      {
        "leadingIndent": 36,
        "lineHeight": 1.3,
        text: [
          { text: 'TERCERA.- ', bold: true, color: '#000000' },
          `CONVENEN LAS PARTES QUE DESDE ESTE MOMENTO QUE EL VENDEDOR EL C. `,
          { text: `${nombreVendedor}, `, bold: true, color: '#000000' },
          `ENTREGARA A EL COMPRADOR C.`,
          { text: `${nombreComprador} `, bold: true, color: '#000000' },
          `RECIBO DE DINERO QUE SERA CORRESPONDIENTE AL PAGO QUE HA QUEDADO OBLIGADO A EL COMPRADOR C. `,
          { text: `${nombreComprador} `, bold: true, color: '#000000' },
          `Y QUE HAN SIDO DESCRITOS EN LA CLAUSULA SEGUNDA EL PRESENTE CONTRATO DE COMPRAVENTA.`



        ],
        margin: [0, 0, 0, 5]
      },
      {
        "canvas": [{ "type": 'line', "x1": 0, "y1": 0, "x2": 520, "y2": 0, "lineWidth": 0.5, "dash": { "length": 5, "space": 2 } }],
        "margin": [0, 5, 0, 15] // Espacio entre la línea y la siguiente cláusula
      },
      {
        "leadingIndent": 36,
        "lineHeight": 1.3,
        text: [
          { text: 'CUARTA.- ', bold: true, color: '#000000' },
          `CONVIENEN LAS PARTES QUE AL MOMENTO DE FRMARSE EL PRESENTE CONTRATO DE COMPRAVENTA, EL VENDEDOR C. `,
          { text: `${nombreVendedor}, `, bold: true, color: '#000000' },
          `HACE ENTREGA DE LA POSESION JURÍDICA, FISICA Y MATERIAL DEL PREDIO RUSTICO YA IDENTIFICADO EN EL ANTECEDENTE PRIMERO DE ESTE CONTRATO DE COMPRAVENTA, POSESIÓN QUE RECIBE EL COMPRADOR C. `,
          { text: `${nombreComprador} `, bold: true, color: '#000000' },
          `, A SU ENTERA SATISFACCIÓN .CON TODAS SUS ENTRADAS Y SALIDAS, USOS, COSTUMBRES Y SERVIDUMBRES ACTIVAS Y PASIVAS Y TODO POR CUANTO POR DERECHO Y DE HECHO LE CORRESPONDA A DICHO PRECIO`,
        ],
        margin: [0, 0, 0, 5]
      },
      {
        "canvas": [{ "type": 'line', "x1": 0, "y1": 0, "x2": 520, "y2": 0, "lineWidth": 0.5, "dash": { "length": 5, "space": 2 } }],
        "margin": [0, 5, 0, 15] // Espacio entre la línea y la siguiente cláusula
      },
      {
        "leadingIndent": 36,
        "lineHeight": 1.3,
        text: [
          { text: 'QUINTA.- ', bold: true, color: '#000000' },
          `MANIFIESTA EL VENDEDOR C. `,
          { text: `${nombreVendedor}, `, bold: true, color: '#000000' },
          `, QUE EL LOTE MULTICITADO SE ENCUENTRA LIBRE DE GRAVAMEN O RESPONSABILIDAD CIVIL ALGUNA`
        ],
        margin: [0, 0, 0, 5]
      },
      {
        "canvas": [{ "type": 'line', "x1": 0, "y1": 0, "x2": 520, "y2": 0, "lineWidth": 0.5, "dash": { "length": 5, "space": 2 } }],
        "margin": [0, 5, 0, 15] // Espacio entre la línea y la siguiente cláusula
      },
      {
        "leadingIndent": 36,
        "lineHeight": 1.3,
        text: [
          { text: 'SEXTA.- ', bold: true, color: '#000000' },
          `CONVIENEN LAS PARTES QUE AL HACER ENTREGA DEL PREDIO FÍSICO YA ESPECIFICADO EN EL ANTECEDENTE PRIMERO DE ESTE CONTRATO DESDE ESE MOMENTO EL COMPRADOR C. `,
          { text: `${nombreComprador} `, bold: true, color: '#000000' },
          `, Y ESTE ULTIMO QUEDA EN TOTAL LIBERTAD DE GESTIONAR Y TRAMITAR SU ESCRITURA, IMPUESTOS, ASÍ COMO LA INSTALACIÓN DE LOS SERVIDOS DE AGUA, LUZ Y DRENAJE ANTE LAS INSTANCIAS CORRESPONDIENTES, SIENDO A CARGO DEL COMPRADOR C.`,
          { text: `${nombreComprador} `, bold: true, color: '#000000' },
          `, LA EROGACIÓN EN UN PORCENTAJE DEL 100% DE TODOS LOS GASTOS QUE POR ELLO SE CAUSEN.`

        ],
        margin: [0, 0, 0, 5]
      },
      {
        "canvas": [{ "type": 'line', "x1": 0, "y1": 0, "x2": 520, "y2": 0, "lineWidth": 0.5, "dash": { "length": 5, "space": 2 } }],
        "margin": [0, 5, 0, 15] // Espacio entre la línea y la siguiente cláusula
      },
      {
        "leadingIndent": 36,
        "lineHeight": 1.3,
        text: [
          { text: 'SÉPTIMA.- ', bold: true, color: '#000000' },
          `AMBAS PARTES MANFIESTAN QUE, EN LA PRESENTE OPERACIÓN, NO EXISTE ERROR, DOLO, MALA FE O ALGÚN OTRO VICIO QUE PUDIERA INVALIDAR POR LO QUE, RENUNCIA A EJERCITAR LA ACCIÓN DE NULIDAD EN LOS TERMINOS PARA EJERCITARLA`,
        ],
        margin: [0, 0, 0, 5]
      },
      {
        "canvas": [{ "type": 'line', "x1": 0, "y1": 0, "x2": 520, "y2": 0, "lineWidth": 0.5, "dash": { "length": 5, "space": 2 } }],
        "margin": [0, 5, 0, 15] // Espacio entre la línea y la siguiente cláusula
      },
      {
        "leadingIndent": 36,
        "lineHeight": 1.3,
        text: [
          { text: 'OCTAVA.- ', bold: true, color: '#000000' },
          `PARA LA INTERPRETACIÓN DE ESTE INSTRUMENTO JURÍDICO, LAS PARTES ACUERDAN SOMETERSE A LAS LEYES DEL ESTADO DE GUANAJUATO Y LOS TRIBUNALES DEL FUERO COMÚN DEL PARTIDO JUDICIAL DE LA UBICACIÓN DEL BIEN INMUEBLE OBJETO DEL PRESENTE CONTRATO HACIENDO EXPRESA RENUNCIA A LOS FUEROS QUE POR RAZÓN DE SUS DOMICILIOS PRESENTE Y FUTUROS PUDIERAN CORRESPONDERLE.`,
        ],
        margin: [0, 0, 0, 20]
      },
      {
        "canvas": [{ "type": 'line', "x1": 0, "y1": 0, "x2": 520, "y2": 0, "lineWidth": 0.5, "dash": { "length": 5, "space": 2 } }],
        "margin": [0, 5, 0, 15] // Espacio entre la línea y la siguiente cláusula
      },

      // Cierre
      {
        text: [
            {
                "text": `LEÍDO QUE EL PRESENTE CONTRATO A LAS PARTES Y ESTANDO DE ACUERDO LAS MISMAS CON SU CONTENIDO Y CON LA FUERZA Y ALCANCE LEGAL DE SU CLAUSULADO, LO FIRMAN EN LA CIUDAD DE ${ciudadFirma}, ${fechaFirmaLetras}`,
                "bold": true
            }
        ],
        margin: [0, 0, 0, 20]
    },

      {
        "lineHeight": 1.3,
        text: `PARA LOS EFECTOS DE IDENTIFICACIÓN DE LAS PARTES EN EL PRESENTE CONTRATO DE COMPRA VENTA, LAS MISMAS SE IDENTIFICAN:  `,
        margin: [0, 0, 0, 20]
      },

      {
        "lineHeight": 1.3,
        text: [
          `VENDEDOR C.`,
          { text: `${nombreVendedor}, `, bold: true, color: '#000000' },
          `CON CREDENCIAL PARA VOTAR FOTOGRAFÍA EXPEDIDA POR EL INSTITUTO NACIONAL ELECTORAL`,
        ],
        margin: [0, 0, 0, 20]
      },

      {
        "lineHeight": 1.3,
        text: [
          `COMPRADOR C.`,
          { text: `${nombreComprador} `, bold: true, color: '#000000' },
          ` CON CREDENCIAL PARA VOTAR FOTOGRAFÍA EXPEDIDA POR EL INSTITUTO NACIONAL ELECTORAL`,
        ],
        margin: [0, 0, 0, 20]
      },

      // Sección de Firmas (Usando tabla para alinear)
      {
        style: 'signatures',
        table: {
          widths: ['*', '*'], // Dos columnas de igual ancho
          body: [
            // Líneas de firma
            [
              { text: '___________________________', alignment: 'center', border: [false, false, false, false] },
              { text: '___________________________', alignment: 'center', border: [false, false, false, false] }
            ],
            // Roles/Nombres
            [
              { text: `C. ${nombreVendedor}\nVENDEDOR`, alignment: 'center', border: [false, false, false, false], margin: [0, 5, 0, 0], bold: true },
              { text: `C. ${nombreComprador}\nCOMPRADOR`, alignment: 'center', border: [false, false, false, false], margin: [0, 5, 0, 0], bold: true }
            ],
          ]
        },
        layout: 'noBorders', // Asegurar que la tabla no tenga bordes visibles
        margin: [0, 50, 0, 20]
      }
    ],

    styles: {
      titulo: {
        fontSize: 14,
        bold: true,
        decoration: 'underline',
        color: '#000000'
      },
      sectionTitle: {
        fontSize: 12,
        bold: true,
        alignment: 'center',
        color: '#000000'
      },
    }
  };

  // Generar y descargar el PDF
  pdfMake.createPdf(documentDefinition).download('Contrato_Compraventa.pdf');

    this.contratoForm.reset();
    this.currentStep = 1;
    this.loteSeleccionado = null;

    // Reestablecer valor por defecto del estado del contrato
    this.contratoForm.patchValue({
    estado_contrato: 'activo'
    });

    // Volver a habilitar campos que pudieron quedar deshabilitados
    this.contratoForm.get('nombre')?.enable();
    this.contratoForm.get('apellido_paterno')?.enable();
    this.contratoForm.get('apellido_materno')?.enable();
    this.contratoForm.get('telefono')?.enable();
}
}