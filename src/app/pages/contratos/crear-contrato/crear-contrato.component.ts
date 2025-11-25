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
(pdfMake as any).vfs = (pdfFonts as any).vfs;


@Component({
  selector: 'app-crear-contrato',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    FooterAdmin,
    HeaderAdmin
],
  templateUrl: './crear-contrato.component.html',
  styleUrl: './crear-contrato.component.css'
})
export class CrearContratoComponent {
  contratoForm: FormGroup;
  enviando = false;
  loteSeleccionado: any = null;


  constructor(
    private fb: FormBuilder,
    private contratoService: ContratoService,
  ) {
    this.contratoForm = this.fb.group({
      id_lote: ['', [Validators.required, Validators.pattern(/^[0-9]+$/)]],
      correo_cliente: ['', [Validators.required, Validators.email]],
      nombre: [''],
      apellido_paterno: [''],
      apellido_materno: [''],
      telefono: [''],
      precio_total: ['', [Validators.required, Validators.min(1), Validators.pattern(/^[0-9]+(\.[0-9]+)?$/)]],
      enganche: ['', [Validators.required, Validators.min(0), Validators.pattern(/^[0-9]+(\.[0-9]+)?$/)]],
      plazo_meses: ['', [Validators.required, Validators.min(1),  Validators.max(12), Validators.pattern(/^[0-9]+$/)]],
      estado_contrato: ['activo'],
      propietario_nombre: [''],
      id_cliente: [null],
      nombre_predio: ['', [Validators.required, Validators.minLength(3), Validators.pattern(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$/)]],
      tipo_documento: ['', [Validators.required, Validators.pattern(/^[A-Za-zÁÉÍÓÚÜÑ ]+$/)]],
      folio_escritura: ['', [Validators.required, Validators.minLength(3)]],
      fecha_emision: ['', [Validators.required, this.validarFechaNoFutura]],
      registro_publico: ['',  [Validators.required, Validators.minLength(5)]],
      colindancia_norte: ['', [Validators.required, Validators.minLength(3)]],
      colindancia_sur: ['', [Validators.required, Validators.minLength(3)]],
      colindancia_este: ['', [Validators.required, Validators.minLength(3)]],
      colindancia_oeste: ['', [Validators.required, Validators.minLength(3)]],
      medida_norte: ['', [Validators.required, Validators.pattern(/^\d+(\.\d+)?$/)]],
      medida_sur: ['', [Validators.required, Validators.pattern(/^\d+(\.\d+)?$/)]],
      medida_este: ['', [Validators.required, Validators.pattern(/^\d+(\.\d+)?$/)]],
      medida_oeste: ['', [Validators.required, Validators.pattern(/^\d+(\.\d+)?$/)]],

    },
    {
    validators: this.validarEngancheMenorQuePrecio()
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

  onSubmit() {
    if (this.contratoForm.invalid) {
      Swal.fire('Campos incompletos', 'Por favor completa todos los campos requeridos.', 'warning');
      return;
    }

    if (this.loteSeleccionado && this.loteSeleccionado.estado_propiedad !== 'disponible') {
    Swal.fire('Lote no disponible', 'No puedes crear un contrato porque el lote no está disponible.', 'error');
    return;
  }

    this.enviando = true;

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
        Swal.fire('Contrato creado', 'El contrato se registró exitosamente.', 'success');
        this.contratoForm.reset({ estado_contrato: 'activo' });

        this.generarPDFContrato();
      },
      error: (err) => {
        Swal.fire('Error', err.error?.message || 'No se pudo crear el contrato', 'error');
      },
      complete: () => this.enviando = false
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

  if (fecha > hoy) {
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


async generarWordContrato() { 
  if (!this.loteSeleccionado || !this.contratoForm.valid) {
    Swal.fire('Error', 'Debes completar los datos del contrato primero.', 'warning');
    return;
  }

  // Cargar imágenes Base64 → Uint8Array
  const headerBytes = await this.convertBase64ToUint8('assets/header.png');
  const footerBytes = await this.convertBase64ToUint8('assets/footer.png');

  const nombreComprador = `${this.contratoForm.get('nombre')?.value} ${this.contratoForm.get('apellido_paterno')?.value} ${this.contratoForm.get('apellido_materno')?.value}`;

  // Fecha actual
  const fecha = new Date();
  const meses = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
  ];
  const dia = fecha.getDate();
  const mes = meses[fecha.getMonth()];
  const anio = fecha.getFullYear();

  // ----------------- CONTENIDO --------------------
  const paragraphs: Paragraph[] = [
    new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
        children: [
          new TextRun({
            text: "CONTRATO PRIVADO DE COMPRAVENTA",
            bold: true,
            size: 32,
          }),
        ],
      }),

    new Paragraph("\n"),

    new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        children: [
          new TextRun(
            `En la ciudad de San Luis de la Paz, GTO, a los ${dia} días del mes de ${mes} del año ${anio}, se lleva a cabo el presente Contrato Privado de Compra-Venta, que celebran por una parte y por su propio derecho el C. `
          ),
          new TextRun({ text: this.loteSeleccionado.propietario_nombre, bold: true }),
          new TextRun(` quien en lo sucesivo se le denominara como la parte vendedora y de la otra parte también por su propio derecho a el/la C. `),
          new TextRun({ text: nombreComprador, bold: true }),
          new TextRun(`, a quien en lo sucesivo se le denominara como la parte compradora, quienes se sujetan al tenor de los siguientes antecedentes y clausulas`),
        ],
      }),

    new Paragraph("\n________________________________________\n"),

    new Paragraph({
        text: "--- A N T E C E D E N T E S ---",
        alignment: AlignmentType.CENTER,
        spacing: { before: 400, after: 150 },
      }),

    new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        children: [
          new TextRun({ text: "PRIMERO.-", bold: true }),
          new TextRun(
            ` Manifiesta el C. ${this.loteSeleccionado.propietario_nombre} ser dueño del predio siguiente: `
          ),
          new TextRun({ text: `Nombre del predio: _________________________________`, bold: true }),
          new TextRun({ text: `, Ubicación: ${this.loteSeleccionado.direccion}, Municipio: ${this.loteSeleccionado.nombre_ciudad}, Estado: ${this.loteSeleccionado.nombre_estado}. ` }),
          new TextRun(`Acreditando la propiedad con: Tipo de documento: _______________________________, Número / Folio: ________________________________, Fecha de emisión: ____________, Registro Público: ________________________.`),
        ]
      }),
      
      // SEGUNDO.
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        children: [
          new TextRun({ text: "SEGUNDO.-", bold: true }),
          new TextRun(
            ` El vendedor decide vender el predio a ${nombreComprador} bajo los términos del presente contrato.`
          ),
        ],
        spacing: { before: 100 }
      }),

      // --- SECCIÓN CLÁUSULAS ---
      new Paragraph({
        text: "--- C L Á U S U L A S ---",
        alignment: AlignmentType.CENTER,
        spacing: { before: 400, after: 150 },
      }),

      // PRIMERA.
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        children: [
          new TextRun({ text: "PRIMERA.-", bold: true }),
          new TextRun(` El vendedor vende y el comprador adquiere el predio.`),
        ],
      }),
      // SEGUNDA.
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        children: [
          new TextRun({ text: "SEGUNDA.-", bold: true }),
          new TextRun(` Precio total: $${this.contratoForm.get('precio_total')?.value} M.N.`),
        ],
        spacing: { before: 100 }
      }),
      // TERCERA.
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        children: [
          new TextRun({ text: "TERCERA.-", bold: true }),
          new TextRun(` El vendedor entregará recibos correspondientes.`),
        ],
        spacing: { before: 100 }
      }),
      // CUARTA.
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        children: [
          new TextRun({ text: "CUARTA.-", bold: true }),
          new TextRun(` El vendedor entrega físicamente el inmueble.`),
        ],
        spacing: { before: 100 }
      }),
      // QUINTA.
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        children: [
          new TextRun({ text: "QUINTA.-", bold: true }),
          new TextRun(` El inmueble está libre de gravamen.`),
        ],
        spacing: { before: 100 }
      }),
      // SEXTA.
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        children: [
          new TextRun({ text: "SEXTA.-", bold: true }),
          new TextRun(` El comprador gestionará escrituras, impuestos y servicios.`),
        ],
        spacing: { before: 100 }
      }),
      // SÉPTIMA.
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        children: [
          new TextRun({ text: "SÉPTIMA.-", bold: true }),
          new TextRun(` No existe error, dolo o mala fe.`),
        ],
        spacing: { before: 100 }
      }),
      // OCTAVA.
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        children: [
          new TextRun({ text: "OCTAVA.-", bold: true }),
          new TextRun(` Las partes se someten a las leyes del estado correspondiente.`),
        ],
        spacing: { before: 100 }
      }),

      // --- SECCIÓN FIRMA Y CIERRE ---
      new Paragraph({
        text: "--- FIRMA Y CIERRE ---",
        alignment: AlignmentType.CENTER,
        spacing: { before: 400, after: 150 },
      }),

      new Paragraph({
        text: `Firmado en San Luis de la Paz, GTO, a los ${dia} días del mes de ${mes} del año ${anio}.`,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }, // Espacio para separar la fecha de las firmas
      }),

      // Cabeceras de Firmas
      new Paragraph({
        children: [
          new TextRun({ text: "LA PARTE VENDEDORA", bold: true, size: 28 }),
          new TextRun({ text: "\t\t\t\t\t\t\t" }), // Ajusta el número de tabs según necesites el espaciado
          new TextRun({ text: "LA PARTE COMPRADORA", bold: true, size: 28 }),
        ],
        alignment: AlignmentType.CENTER,
      }),

      // Nombres
      new Paragraph({
        children: [
          new TextRun({ text: `Nombre: ${this.loteSeleccionado.propietario_nombre}` }),
          new TextRun({ text: "\t\t\t\t\t\t" }),
          new TextRun({ text: `Nombre: ${nombreComprador}` }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 }
      }),

      // Línea de Firma
      new Paragraph({
        children: [
          new TextRun({ text: "Firma: ___________________________" }),
          new TextRun({ text: "\t\t\t\t\t\t" }),
          new TextRun({ text: "Firma: ___________________________" }),
        ],
        alignment: AlignmentType.CENTER,
      }),

    ];

    // ----------- HEADER CORRECTO (Se mantiene la configuración) ----------
    const header = new Header({
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new ImageRun({
              data: headerBytes,
              transformation: {
                width: 600, // Ajustado para que quepa y no ocupe todo el ancho
                height: 100
              }
            } as any)
          ],
        }),
      ],
    });

    // ----------- FOOTER CORRECTO (Se mantiene la configuración) ----------
    const footer = new Footer({
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new ImageRun({
              data: footerBytes,
              transformation: {
                width: 600, // Ajustado igual que el header
                height: 80
              }
            } as any),
          ],
        }),
      ],
    });

    // -------------- DOCUMENTO (Añadido estilo de fuente por defecto) ----------------
    const doc = new Document({
      // Establece una fuente base para todo el documento
      styles: {
        default: {
          document: {
            run: {
              // Fuente común y tamaño de 12pt (24 half points)
              font: "Arial", 
              size: 24, 
            },
          },
        },
      },
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 720,
                bottom: 720,
                left: 720, // 1.25 cm approx.
                right: 720, // 1.25 cm approx.
              },
            },
          },
          headers: { default: header },
          footers: { default: footer },
          children: paragraphs,
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `Contrato_Lote_${this.loteSeleccionado.id_lote}.docx`);
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
  const unidades = ['','uno','dos','tres','cuatro','cinco','seis','siete','ocho','nueve'];
  const decenas = ['','diez','veinte','treinta','cuarenta','cincuenta','sesenta','setenta','ochenta','noventa'];
  const especiales = ['once','doce','trece','catorce','quince','dieciséis','diecisiete','dieciocho','diecinueve'];
  const centenas = ['','ciento','doscientos','trescientos','cuatrocientos','quinientos','seiscientos','setecientos','ochocientos','novecientos'];

  if (num === 0) return 'cero';
  if (num === 100) return 'cien';

  let letras = '';

  if (num >= 1000) {
    const miles = Math.floor(num / 1000);
    letras += (miles === 1 ? 'mil' : this.numeroALetras(miles) + ' mil') + ' ';
    num = num % 1000;
  }

  if (num >= 100) {
    const c = Math.floor(num / 100);
    letras += centenas[c] + ' ';
    num = num % 100;
  }

  if (num >= 20) {
    const d = Math.floor(num / 10);
    letras += decenas[d] + (num % 10 > 0 ? ' y ' + unidades[num % 10] : '');
  } else if (num > 10 && num < 20) {
    letras += especiales[num - 11];
  } else if (num === 10) {
    letras += 'diez';
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


async generarPDFContrato() {
  if (!this.loteSeleccionado || !this.contratoForm.valid) {
    Swal.fire('Error', 'Debes completar los datos del contrato primero.', 'warning');
    return;
  }

  const fechaHoy = new Date();
  const meses = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
  ];
  const dia = fechaHoy.getDate();
  const mes = meses[fechaHoy.getMonth()];
  const anio = fechaHoy.getFullYear();

  // NOTA: Asumiendo que 'convertToBase64' y la imagen 'hoja' funcionan para el fondo.
  const base64 = await this.convertToBase64('assets/hoja_membretada.png');
  const nombreVendedor = this.loteSeleccionado.propietario_nombre;
  const nombreComprador = `${this.contratoForm.get('nombre')?.value} ${this.contratoForm.get('apellido_paterno')?.value} ${this.contratoForm.get('apellido_materno')?.value}`;
  const nombrePredio = this.contratoForm.value.nombre_predio;
  const ubicacionCompleta = `${this.loteSeleccionado.direccion}, ${this.loteSeleccionado.nombre_ciudad}, ${this.loteSeleccionado.nombre_estado}`;
  const colonia = `${this.loteSeleccionado.nombre_colonia}`
  const ciudad = `${this.loteSeleccionado.nombre_ciudad}`
  const tipoDocumento = this.contratoForm.value.tipo_documento;
  const folioEscritura = this.contratoForm.value.folio_escritura;
  const fechaEmision = this.contratoForm.value.fecha_emision;
  const registroPublico = this.contratoForm.value.registro_publico;

  const colNorte = this.contratoForm.value.colindancia_norte;
  const colSur = this.contratoForm.value.colindancia_sur;
  const colEste = this.contratoForm.value.colindancia_este;
  const colOeste = this.contratoForm.value.colindancia_oeste;
  const medNorte = this.contratoForm.value.medida_norte;
  const medSur = this.contratoForm.value.medida_sur;
  const medEste = this.contratoForm.value.medida_este;
  const medOeste = this.contratoForm.value.medida_oeste;
  const precioTotal = this.contratoForm.get('precio_total')?.value;
  const condicionesPago = this.contratoForm.value.condiciones_pago;
  const estadoJurisdiccion = this.contratoForm.value.estado_jurisdiccion;
  const ciudadFirma = this.contratoForm.value.ciudad_firma;

  const folioEscrituraLetras = this.numeroALetras(folioEscritura);
  const fechaEmisionLetras = this.fechaALetras(fechaEmision);



  const documentDefinition: any = {
    // Márgenes ajustados para el fondo del membrete
    pageMargins: [40, 120, 40, 60], 

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
        text: [
          `En la ciudad de San Luis de la Paz, GTO, a los ${dia} días del mes de ${mes} del año ${anio}, se lleva a cabo el presente Contrato Privado de Compra-Venta, que celebran por una parte y por su propio derecho el C. `,
          { text: `${nombreVendedor}, `, bold: true, color: '#000000' },
          `a quien en lo sucesivo se le denominará como la parte vendedora y de la otra parte también por su propio derecho a el/la`,
          { text: `${nombreComprador}, `, bold: true, color: '#000000' },
          `a quien en lo sucesivo se le denominará como la parte compradora, quienes se sujetan al tenor de los siguientes antecedentes y cláusulas.`,
        ],
        margin: [0, 0, 0, 20]
      },

      // Sección ANTECEDENTES (Con líneas de separación)
      {
        canvas: [{ type: 'line', x1: 0, y1: 0, x2: 520, y2: 0, lineWidth: 0.5 }],
        margin: [0, 10, 0, 5]
      },
      { text: 'A N T E C E D E N T E S', style: 'sectionTitle' },
      {
        canvas: [{ type: 'line', x1: 0, y1: 0, x2: 520, y2: 0, lineWidth: 0.5 }],
        margin: [0, 5, 0, 15]
      },

      // ANTECEDENTE PRIMERO (Formato justificado y combinado)
      {
        text: [
          { text: 'PRIMERO.- ', bold: true, color: '#000000' },
          `Manifiesta el C. `,
          { text: `${nombreVendedor} `, bold: true, color: '#000000' },
          `ser dueño y poseedor de un predio rústico o urbano denominado como`,
          { text: `${nombrePredio}, `, bold: true, color: '#000000' },
          `ubicado en la localidad ${colonia} perteneciente al municipio de ${ciudad}, GTO, quien acredita la propiedad con la ${tipoDocumento} con partida numero ${folioEscritura} (${folioEscrituraLetras}),  QUE SE EXPIDE EN LA CIUDAD DE SAN LUIS DE LA PAZ, ESTADO DE GUANAJUATO A LOS ${fechaEmisionLetras}, Y QUE SE ENCUENTRA INSCRITA EN EL REGISTRO PUBLICO DE LA PROPIEDAD CON FOLIOS ELECTRÓNICOS ${registroPublico}. EL CUAL VENDE LA SIGUIENTE FRACCIÓN`
        ],
        margin: [0, 0, 0, 10]
      },

      // Medidas y colindancias (Usando UL para la sangría, pero con estilo más sobrio)
      { text: 'El inmueble cuenta con las siguientes medidas y colindancias:', margin: [0, 0, 0, 5] },
      {
        ul: [
          { text: `AL NORTE: ${medNorte} M. y linda con ${colNorte}` },
          { text: `AL SUR: ${medSur} M. y linda con ${colSur}` },
          { text: `AL ORIENTE: ${medEste} M. y linda con ${colEste}` },
          { text: `AL PONIENTE: ${medOeste} M. y linda con ${colOeste}` },
        ],
        style: 'colindanciasList',
        margin: [10, 0, 0, 15] // Sangría del listado
      },

      // ANTECEDENTE SEGUNDO
      {
        text: [
          { text: 'SEGUNDO.- ', bold: true, color: '#000000' },
          `Por último, manifiesta el vendedor que por convenir a sus intereses ha decidido vender la totalidad del predio descrito en el antecedente primero a `,
          { text: `${nombreComprador} `, bold: true, color: '#000000' },
          `bajo los términos y condiciones del presente contrato.`
        ],
        margin: [0, 0, 0, 20]
      },

      // Sección CLÁUSULAS (Con líneas de separación)
      {
        canvas: [{ type: 'line', x1: 0, y1: 0, x2: 520, y2: 0, lineWidth: 0.5 }],
        margin: [0, 10, 0, 5]
      },
      { text: 'C L Á U S U L A S', style: 'sectionTitle' },
      {
        canvas: [{ type: 'line', x1: 0, y1: 0, x2: 520, y2: 0, lineWidth: 0.5 }],
        margin: [0, 5, 0, 15]
      },

      // CLÁUSULAS (Estructura de texto combinado)
      {
        text: [
          { text: 'PRIMERA.- ', bold: true, color: '#000000' },
          `El vendedor vende el predio descrito en el antecedente primero, y el comprador lo adquiere en el estado físico y jurídico en el que se encuentra.`,
        ],
        margin: [0, 0, 0, 5]
      },
      {
        text: [
          { text: 'SEGUNDA.- ', bold: true, color: '#000000' },
          `El precio total de la operación es de: $${precioTotal} M.N. El comprador se obliga a pagar bajo las siguientes condiciones: ${condicionesPago}.`,
        ],
        margin: [0, 0, 0, 5]
      },
      {
        text: [
          { text: 'TERCERA.- ', bold: true, color: '#000000' },
          `El vendedor entregará al comprador el recibo correspondiente por los pagos realizados.`,
        ],
        margin: [0, 0, 0, 5]
      },
      {
        text: [
          { text: 'CUARTA.- ', bold: true, color: '#000000' },
          `Al firmarse este contrato, el vendedor hace entrega material y jurídica del inmueble al comprador.`,
        ],
        margin: [0, 0, 0, 5]
      },
      {
        text: [
          { text: 'QUINTA.- ', bold: true, color: '#000000' },
          `El vendedor declara que el inmueble está libre de gravamen.`,
        ],
        margin: [0, 0, 0, 5]
      },
      {
        text: [
          { text: 'SEXTA.- ', bold: true, color: '#000000' },
          `El comprador gestionará escrituras, impuestos y servicios, cubriendo los gastos correspondientes.`,
        ],
        margin: [0, 0, 0, 5]
      },
      {
        text: [
          { text: 'SÉPTIMA.- ', bold: true, color: '#000000' },
          `Ambas partes manifiestan que no existe error, dolo o mala fe que pudiera invalidar este contrato.`,
        ],
        margin: [0, 0, 0, 5]
      },
      {
        text: [
          { text: 'OCTAVA.- ', bold: true, color: '#000000' },
          `Las partes se someten a las leyes del estado de ${estadoJurisdiccion}.`,
        ],
        margin: [0, 0, 0, 20]
      },

      // Cierre
      {
        text: `Leído el presente contrato y estando conformes, lo firman en la ciudad de ${ciudadFirma}, a los ${dia} días del mes de ${mes} del año ${anio}.`,
        margin: [0, 0, 0, 40]
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
            // Nombres de las partes
            [
              { text: 'LA PARTE VENDEDORA', bold: true, alignment: 'center', margin: [0, 5, 0, 0], border: [false, false, false, false] },
              { text: 'LA PARTE COMPRADORA', bold: true, alignment: 'center', margin: [0, 5, 0, 0], border: [false, false, false, false] }
            ],
            // Nombres completos
            [
              { text: `C. ${nombreVendedor}`, alignment: 'center', border: [false, false, false, false] },
              { text: `C. ${nombreComprador}`, alignment: 'center', border: [false, false, false, false] }
            ]
          ]
        },
        layout: 'noBorders', // Oculta los bordes de la tabla
        margin: [0, 10, 0, 0]
      }
    ],

    styles: {
      titulo: {
        fontSize: 14, // Ligeramente más pequeño que el original
        bold: true
      },
      sectionTitle: {
        fontSize: 12, // Títulos de sección más pequeños
        bold: true,
        alignment: 'center'
      },
      colindanciasList: {
        // Estilo para la lista de colindancias
        fontSize: 10,
        alignment: 'justify',
        lineHeight: 1.2
      }
    }
  };

  pdfMake.createPdf(documentDefinition).download(`Contrato_Lote_${this.loteSeleccionado.id_lote}.pdf`);
}



}
