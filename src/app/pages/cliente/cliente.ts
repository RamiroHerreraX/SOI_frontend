import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ClienteService, Cliente } from '../../services/cliente';
import { HeaderAdmin } from "../../shared/header-admin/header-admin";
import { FooterAdmin } from "../../shared/footer-admin/footer-admin";
import { ScrollTopComponent } from "../scroll-top/scroll-top.component";
import { ClienteFilterPipe } from '../../pipes/cliente-filter.pipe';

declare var bootstrap: any;

@Component({
  selector: 'app-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderAdmin, FooterAdmin, ScrollTopComponent, ClienteFilterPipe],
  templateUrl: './cliente.html',
  styleUrls: ['./cliente.css']
})
export class ClienteComponent implements OnInit {

  clientes: Cliente[] = [];
  clienteSeleccionado: Cliente | null = null;

  mostrarFormulario = false;
  modoEdicion = false;

  filtroNombre = '';
  filtroCorreo = '';
  filtroCurp = '';
  filtroClave = '';

  nuevoCliente: Cliente = {
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    correo: '',
    telefono: '',
    curp: '',
    clave_elector: '',
    doc_identificacion: null,
    doc_curp: null
  };

  constructor(public clienteService: ClienteService) {}

  ngOnInit(): void {
    this.cargarClientes();
  }

  cargarClientes(): void {
    this.clienteService.getClientes().subscribe({
      next: data => this.clientes = data,
      error: err => this.mostrarError(err, 'Error al cargar los clientes.')
    });
  }

  crearCliente(form: NgForm): void {
    if (
      form.invalid ||
      !this.nuevoCliente.doc_identificacion ||
      !this.nuevoCliente.doc_curp
    ) {
      this.showToast('Completa todos los campos y sube los PDFs.', 'warning');
      form.control.markAllAsTouched();
      return;
    }

    this.clienteService.crearCliente(this.nuevoCliente).subscribe({
      next: () => {
        this.showToast('Cliente creado correctamente.', 'success');
        this.cargarClientes();
        this.limpiarFormulario(form);
        this.mostrarFormulario = false;
      },
      error: err => this.mostrarError(err, 'Error al crear el cliente.')
    });
  }

  verDetalles(cliente: Cliente): void {
    this.clienteSeleccionado = cliente;

    const modalEl = document.getElementById('modalDetallesCliente');
    if (modalEl) {
      const modal = new bootstrap.Modal(modalEl);
      modal.show();
    }
  }

actualizarCliente(form: NgForm): void {
  if (!this.nuevoCliente.curp) {
    this.showToast('Cliente inválido.', 'danger');
    return;
  }

  if (form.invalid) {
    this.showToast('Completa todos los campos.', 'warning');
    form.control.markAllAsTouched();
    return;
  }

  this.clienteService.actualizarCliente(this.nuevoCliente).subscribe({
    next: () => {
      this.showToast('Cliente actualizado correctamente.', 'success');
      this.cargarClientes();
      this.cancelarEdicion();
    },
    error: err => this.mostrarError(err, 'Error al actualizar el cliente.')
  });
}


esArchivo(valor: any): boolean {
  // Si está vacío no es archivo
  if (!valor) return false;

  // Si viene como string desde la BD → SÍ es archivo
  if (typeof valor === 'string') return true;

  // Si es un archivo subido por el usuario → SÍ es archivo
  return valor instanceof File;
}

// cliente.component.ts
getPdfUrl(doc: string | File | null | undefined): string | null {
  if (!doc) return null;           // no hay archivo
  if (doc instanceof File) return null; // es un File recién subido, no tiene URL todavía
  return this.clienteService.getPdfUrl(doc); // es un string guardado
}



// TS
isFile(valor: any): boolean {
  return valor instanceof File;
}
onSubmit(form: NgForm) {
  if (this.modoEdicion) {
    this.actualizarCliente(form);
  } else {
    this.crearCliente(form);
  }
}


  eliminarCliente(curp: string): void {
    if (!confirm('¿Seguro que deseas eliminar este cliente?')) return;

    this.clienteService.eliminarCliente(curp).subscribe({
      next: () => {
        this.showToast('Cliente eliminado correctamente.', 'success');
        this.cargarClientes();
      },
      error: err => this.mostrarError(err, 'Error al eliminar el cliente.')
    });
  }

  cancelarEdicion(): void {
    this.modoEdicion = false;
    this.mostrarFormulario = false;
    this.nuevoCliente = {
      nombre: '',
      apellido_paterno: '',
      apellido_materno: '',
      correo: '',
      telefono: '',
      curp: '',
      clave_elector: '',
      doc_identificacion: null,
      doc_curp: null
    };
  }

  limpiarFormulario(form: NgForm): void {
    form.resetForm();
  }

  validarTelefono(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^0-9]/g, '').slice(0, 10);
    this.nuevoCliente.telefono = input.value;
  }

  limpiarCurp(): void {
    if (!this.nuevoCliente.curp) return;
    this.nuevoCliente.curp = this.nuevoCliente.curp.toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  limpiarClaveElector(): void {
    if (!this.nuevoCliente.clave_elector) return;
    this.nuevoCliente.clave_elector = this.nuevoCliente.clave_elector.toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  showToast(mensaje: string, tipo: 'success' | 'danger' | 'warning' = 'success'): void {
    const toastEl = document.getElementById('liveToast');

    if (toastEl) {
      const bsToast = new bootstrap.Toast(toastEl);
      const body = toastEl.querySelector('.toast-body');
      const title = toastEl.querySelector('.toast-title');

      if (body) body.innerHTML = mensaje;

      toastEl.className = toastEl.className.replace(/\btext-bg-\S+/g, '');
      toastEl.classList.add(`text-bg-${tipo}`);

      if (title) title.textContent =
        tipo === 'success' ? 'Éxito' :
        tipo === 'danger' ? 'Error' : 'Advertencia';

      bsToast.show();
    }
  }

  mostrarError(err: any, mensajePorDefecto: string): void {
    console.error(err);
    let mensaje = mensajePorDefecto;

    if (err.status === 0) mensaje = 'No se puede conectar al servidor.';
    else if (err.status === 400) mensaje = err.error?.message || 'Datos inválidos.';
    else if (err.status === 404) mensaje = 'Cliente no encontrado.';
    else if (err.status === 409) mensaje = err.error?.message || 'CURP o correo ya registrados.';
    else if (err.status === 500) mensaje = err.error?.message || 'Error interno del servidor.';

    this.showToast(mensaje, 'danger');
  }

  editarCliente(cliente: Cliente): void {
  this.modoEdicion = true;
  this.mostrarFormulario = true;

  this.nuevoCliente = {
    ...cliente,
    doc_identificacion: cliente.doc_identificacion,
    doc_curp: cliente.doc_curp
  };
}

onFileChange(event: any, tipo: "doc_identificacion" | "doc_curp") {
  const archivo = event.target.files[0];
  if (archivo && archivo.type === "application/pdf") {
    this.nuevoCliente[tipo] = archivo;
  } else {
    this.showToast("Solo se permiten archivos PDF.", "warning");
  }
}

// BORRAR PDF manualmente
borrarArchivo(tipo: "doc_identificacion" | "doc_curp") {
  this.nuevoCliente[tipo] = null; // Lo marca como eliminado
}

}
