import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ContratoService } from '../../../services/contrato.service';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { FooterAdmin } from "../../../shared/footer-admin/footer-admin";
import { HeaderAdmin } from "../../../shared/header-admin/header-admin";

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

}
