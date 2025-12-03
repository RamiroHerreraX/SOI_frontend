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

  // Modelo principal
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

  // ===========================
  // CARGAR CLIENTES
  // ===========================
  cargarClientes(): void {
    this.clienteService.getClientes().subscribe({
      next: data => this.clientes = data,
      error: err => this.mostrarError(err, 'Error al cargar los clientes.')
    });
  }

  // ===========================
  // CREAR CLIENTE
  // ===========================
  crearCliente(form: NgForm): void {

    if (
      form.invalid ||
      !this.nuevoCliente.doc_identificacion ||
      !this.nuevoCliente.doc_curp
    ) {
      this.showToast('Completa todos los campos y sube los PDF requeridos.', 'warning');
      form.control.markAllAsTouched();
      return;
    }

    this.clienteService.crearCliente(this.nuevoCliente).subscribe({
      next: () => {
        this.showToast('Cliente creado correctamente', 'success');
        this.cargarClientes();
        this.limpiarFormulario(form);
        this.mostrarFormulario = false;
      },
      error: err => this.mostrarError(err, 'Error al crear el cliente.')
    });
  }

  // ===========================
  // EDITAR CLIENTE
  // ===========================
  editarCliente(c: Cliente): void {
    this.modoEdicion = true;
    this.mostrarFormulario = true;

    this.nuevoCliente = { ...c }; // copiar datos existentes
  }

  // ===========================
  // ACTUALIZAR CLIENTE
  // ===========================
  actualizarCliente(form: NgForm): void {

    if (!this.nuevoCliente.curp) {
      this.showToast('Cliente inválido para editar.', 'danger');
      return;
    }

    if (form.invalid) {
      this.showToast('Completa todos los campos.', 'warning');
      form.control.markAllAsTouched();
      return;
    }

    this.clienteService.actualizarCliente(this.nuevoCliente).subscribe({
      next: () => {
        this.showToast('Cliente actualizado correctamente', 'success');
        this.cargarClientes();
        this.cancelarEdicion();
      },
      error: err => this.mostrarError(err, 'Error al actualizar el cliente.')
    });
  }

  // ===========================
  // SUBMIT GENERAL
  // ===========================
  onSubmit(form: NgForm) {
    if (this.modoEdicion) {
      this.actualizarCliente(form);
    } else {
      this.crearCliente(form);
    }
  }

  // ===========================
  // VER DETALLES
  // ===========================
  verDetalles(cliente: Cliente): void {
    this.clienteSeleccionado = cliente;

    const modalEl = document.getElementById('modalDetallesCliente');
    if (modalEl) {
      const modal = new bootstrap.Modal(modalEl);
      modal.show();
    }
  }

  // ===========================
  // ELIMINAR CLIENTE
  // ===========================
  eliminarCliente(curp: string): void {
    if (!confirm('¿Seguro que deseas eliminar este cliente?')) return;

    this.clienteService.eliminarCliente(curp).subscribe({
      next: () => {
        this.showToast('Cliente eliminado correctamente', 'success');
        this.cargarClientes();
      },
      error: err => this.mostrarError(err, 'Error al eliminar el cliente.')
    });
  }

  // ===========================
  // CANCELAR EDICIÓN
  // ===========================
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

  // ===========================
  // LIMPIAR FORMULARIO
  // ===========================
  limpiarFormulario(form: NgForm): void {
    form.resetForm();
    this.cancelarEdicion();
  }

  // ===========================
  // ARCHIVOS PDF
  // ===========================
  onFileChange(event: any, campo: string) {
    const archivo = event.target.files[0];
    if (archivo && archivo.type === "application/pdf") {
      (this.nuevoCliente as any)[campo] = archivo;
    } else {
      this.showToast('Solo se permiten PDFs.', 'warning');
    }
  }

  getPdfUrl(doc: string | File | null | undefined): string | null {
    if (!doc) return null;

    if (doc instanceof File) return null; // archivo local sin subir todavía

    return this.clienteService.getPdfUrl(doc); // string desde BD
  }

  // ===========================
  // INPUTS
  // ===========================
  validarTelefono(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^0-9]/g, '').slice(0, 10);
    this.nuevoCliente.telefono = input.value;
  }

  formatearCurp(event: any): void {
    event.target.value = event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 18);
    this.nuevoCliente.curp = event.target.value;
  }

  formatearClave(event: any): void {
    event.target.value = event.target.value.toUpperCase().replace(/[^A-Z0-9\-]/g, '').slice(0, 20);
    this.nuevoCliente.clave_elector = event.target.value;
  }

  // ===========================
  // TOAST Y ERRORES
  // ===========================
  mostrarError(err: any, mensaje: string) {
    console.error(mensaje, err);
    this.showToast(mensaje, 'danger');
  }

  showToast(mensaje: string, tipo: string = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-bg-${tipo} border-0 show`;
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.right = '20px';
    toast.style.zIndex = '9999';
    toast.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">${mensaje}</div>
        <button type="button" class="btn-close me-2 m-auto"></button>
      </div>`;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 3000);
  }
  soloNumeros(event: any, maxLength: number) {
  const input = event.target;
  input.value = input.value.replace(/[^0-9]/g, '');

  if (input.value.length > maxLength) {
    input.value = input.value.slice(0, maxLength);
  }
}
getNombreArchivo(valor: any): string {
  if (!valor) return '';
  if (valor instanceof File) {
    return valor.name;
  }
  return String(valor);
}


}
