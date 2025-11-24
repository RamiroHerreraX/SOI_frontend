import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
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
      id_cliente: [null]
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
      },
      error: (err) => {
        Swal.fire('Error', err.error?.message || 'No se pudo crear el contrato', 'error');
      },
      complete: () => this.enviando = false
    });
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

evitarNotacion(event: KeyboardEvent) {
  if (["e", "E", "+", "-"].includes(event.key)) {
    event.preventDefault();
  }
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
            `En la ciudad de San Luis de la Paz, GTO, a los ${dia} días del mes de ${mes} del año ${anio}, se lleva a cabo el presente Contrato Privado de Compraventa, que celebran por una parte el C. `
          ),
          new TextRun({ text: this.loteSeleccionado.propietario_nombre, bold: true }),
          new TextRun(` (LA PARTE VENDEDORA) y el/la C. `),
          new TextRun({ text: nombreComprador, bold: true }),
          new TextRun(` (LA PARTE COMPRADORA).`),
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


async generarPDFContrato() {
  if (!this.loteSeleccionado || !this.contratoForm.valid) {
    Swal.fire('Error', 'Debes completar los datos del contrato primero.', 'warning');
    return;
  }

  const fechaHoy = new Date();
  const fechaTexto = fechaHoy.toLocaleDateString();

  const meses = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
  ];

  const dia = fechaHoy.getDate();
  const mes = meses[fechaHoy.getMonth()];
  const anio = fechaHoy.getFullYear();

  const base64 = await this.convertToBase64('assets/hoja_membrete.png');


  const documentDefinition: any = {
    pageMargins: [40, 80, 40, 60],

    background: [
      {
        image: 'hoja',
        width: 595,
        alignment: 'center',
      }
    ],

    images: {
      hoja: base64  
    },

    content: [
      {
        text: 'CONTRATO PRIVADO DE COMPRAVENTA',
        style: 'titulo',
        alignment: 'center'
      },

      { text: '\n' },

      {
        text: `En la ciudad de San Luis de la Paz, GTO, a los ${dia} días del mes de ${mes} del año ${anio}, se lleva a cabo el presente Contrato Privado de Compraventa, que celebran por una parte y por su propio derecho el C. ${this.loteSeleccionado.propietario_nombre}, a quien en lo sucesivo se le denominará como LA PARTE VENDEDORA, y por la otra parte el/la C. ${this.contratoForm.get('nombre')?.value} ${this.contratoForm.get('apellido_paterno')?.value} ${this.contratoForm.get('apellido_materno')?.value}, a quien en lo sucesivo se le denominará como LA PARTE COMPRADORA, quienes se sujetan al tenor de los siguientes antecedentes y cláusulas.`
      },

      { text: '\n________________________________________\n', alignment: 'center' },

      { text: 'A N T E C E D E N T E S', style: 'subtitulo' },

      { text: '\nPRIMERO.\n', bold: true },

      {
        text: `Manifiesta el C. ${this.loteSeleccionado.propietario_nombre} ser dueño y poseedor del predio rústico o urbano denominado:`
      },

      { text: `Nombre del predio: _________________________________` },
      { text: `Ubicación: ${this.loteSeleccionado.direccion}` },
      { text: `Municipio: ${this.loteSeleccionado.nombre_ciudad}` },
      { text: `Estado: ${this.loteSeleccionado.nombre_estado}` },

      { text: '\nAcreditando la propiedad con:' },
      { text: `Tipo de documento: _______________________________` },
      { text: `Número / Folio: ________________________________` },
      { text: `Fecha de emisión: ____________` },
      { text: `Registro Público (si aplica): ________________________` },

      { text: '\nEl inmueble cuenta con las siguientes medidas y colindancias:' },

      { text: '• AL NORTE: ______ M. y linda con ________________________________' },
      { text: '• AL SUR: ______ M. y linda con _________________________________' },
      { text: '• AL ORIENTE: ______ M. y linda con ______________________________' },
      { text: '• AL PONIENTE: ______ M. y linda con _____________________________' },

      {
        text: '\nSEGUNDO.\n',
        bold: true
      },

      {
        text:
          `Manifiesta el vendedor que por convenir a sus intereses ha decidido vender la totalidad del predio descrito en el antecedente primero a ${this.contratoForm.get('nombre')?.value} ${this.contratoForm.get('apellido_paterno')?.value} ${this.contratoForm.get('apellido_materno')?.value} bajo los términos y condiciones del presente contrato.`
      },

      { text: '\n________________________________________\n', alignment: 'center' },

      { text: 'C L Á U S U L A S', style: 'subtitulo' },

      { text: '\nPRIMERA.\n', bold: true },
      { text: `El vendedor vende el predio descrito en el antecedente primero, y el comprador lo adquiere en el estado físico y jurídico en el que se encuentra.` },

      { text: '\nSEGUNDA.\n', bold: true },
      { text: `El precio total de la operación es de: $${this.contratoForm.get('precio_total')?.value} M.N.` },
      { text: 'El comprador se obliga a pagar bajo las siguientes condiciones:' },
      { text: '• Forma de pago: ___________________________' },
      { text: '• Fecha(s) de pago: _________________________' },
      { text: '• Cantidad entregada a la firma: ____________' },

      { text: '\nTERCERA.\n', bold: true },
      { text: 'El vendedor entregará al comprador el recibo correspondiente por los pagos realizados.' },

      { text: '\nCUARTA.\n', bold: true },
      { text: 'Al firmarse este contrato, el vendedor hace entrega material y jurídica del inmueble al comprador.' },

      { text: '\nQUINTA.\n', bold: true },
      { text: 'El vendedor declara que el inmueble está libre de gravamen.' },

      { text: '\nSEXTA.\n', bold: true },
      { text: 'El comprador gestionará escrituras, impuestos y servicios, cubriendo los gastos correspondientes.' },

      { text: '\nSÉPTIMA.\n', bold: true },
      { text: 'Ambas partes manifiestan que no existe error, dolo o mala fe que pudiera invalidar este contrato.' },

      { text: '\nOCTAVA.\n', bold: true },
      { text: 'Las partes se someten a las leyes del estado de _______________________.' },

      { text: '\n________________________________________\n', alignment: 'center' },

      { text: 'FIRMA Y CIERRE', style: 'subtitulo' },

      {
        text:
          `Leído el presente contrato y estando conformes, lo firman en la ciudad de _________________________, a los ____ días del mes de ______________ del año ________.`
      },

      { text: '\n\nVENDEDOR\n', bold: true },
      { text: `Nombre: ${this.loteSeleccionado.propietario_nombre}` },
      { text: 'Firma: ___________________________' },

      { text: '\n\nCOMPRADOR\n', bold: true },
      {
        text: `Nombre: ${this.contratoForm.get('nombre')?.value} ${this.contratoForm.get('apellido_paterno')?.value} ${this.contratoForm.get('apellido_materno')?.value}`
      },
      { text: 'Firma: ___________________________' }
    ],

    styles: {
      titulo: { fontSize: 16, bold: true },
      subtitulo: { fontSize: 14, bold: true, alignment: 'center' },
    }
  };

  pdfMake.createPdf(documentDefinition).download(`Contrato_Lote_${this.loteSeleccionado.id_lote}.pdf`);
}



}
