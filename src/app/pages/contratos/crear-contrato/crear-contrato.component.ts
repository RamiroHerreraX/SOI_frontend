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

  constructor(
    private fb: FormBuilder,
    private contratoService: ContratoService
  ) {
    this.contratoForm = this.fb.group({
      id_lote: ['', Validators.required],
      correo_cliente: ['', [Validators.required, Validators.email]],
      nombre: [''],
      apellido_paterno: [''],
      apellido_materno: [''],
      telefono: [''],
      precio_total: ['', [Validators.required, Validators.min(1)]],
      enganche: ['', [Validators.required, Validators.min(0)]],
      plazo_meses: ['', [Validators.required, Validators.min(1)]],
      estado_contrato: ['activo'],
      propietario_nombre: [''],
    });
    this.contratoForm.get('correo_cliente')?.valueChanges.subscribe(correo => {
    if (correo && this.contratoForm.get('correo_cliente')?.valid) {
      this.contratoService.buscarClientePorCorreo(correo).subscribe({
        next: (cliente) => {
          // Rellenamos los campos automáticamente
          this.contratoForm.patchValue({
            nombre: cliente.nombre,
            apellido_paterno: cliente.apellido_paterno,
            apellido_materno: cliente.apellido_materno,
            telefono: cliente.telefono
          });

          // Los ponemos solo lectura
          this.contratoForm.get('nombre')?.disable();
          this.contratoForm.get('apellido_paterno')?.disable();
          this.contratoForm.get('apellido_materno')?.disable();
          this.contratoForm.get('telefono')?.disable();
        },
        error: () => {
          // Si no existe el cliente, habilitamos los campos para capturar nuevo
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
        }
      });
    }
  });
}

  onSubmit() {
    if (this.contratoForm.invalid) {
      Swal.fire('Campos incompletos', 'Por favor completa todos los campos requeridos.', 'warning');
      return;
    }

    this.enviando = true;

    this.contratoService.crearContrato(this.contratoForm.value).subscribe({
      next: (res) => {
        Swal.fire('Contrato creado', 'El contrato se registró exitosamente.', 'success');
        this.contratoForm.reset({ estado_contrato: 'activo' });
      },
      error: (err) => {
        console.error(err);
        Swal.fire('Error', err.error?.message || 'No se pudo crear el contrato', 'error');
      },
      complete: () => this.enviando = false
    });
  }
}
