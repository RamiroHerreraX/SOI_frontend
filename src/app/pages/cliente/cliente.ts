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
  filtroClave = ''; // nuevo filtro para INE

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


  constructor(private clienteService: ClienteService) {}

  ngOnInit(): void {
    this.cargarClientes();
  }

  cargarClientes(): void {
    this.clienteService.getClientes().subscribe({
      next: (data) => this.clientes = data,
      error: (err) => this.mostrarError(err, 'Error al cargar los clientes.')
    });
  }

  crearCliente(form: NgForm): void {
    if (form.invalid) {
      this.showToast('Por favor completa todos los campos requeridos.', 'warning');
      return;
    }

    this.clienteService.crearCliente(this.nuevoCliente).subscribe({
      next: () => {
        this.showToast('Cliente creado correctamente.', 'success');
        this.cargarClientes();
        this.limpiarFormulario(form);
      },
      error: (err) => this.mostrarError(err, 'Error al crear el cliente.')
    });
  }

  editarCliente(cliente: Cliente): void {
    this.clienteSeleccionado = { ...cliente };
    this.modoEdicion = true;
    this.mostrarFormulario = true;
  }

  actualizarCliente(): void {
    if (!this.clienteSeleccionado?.curp) {
      this.showToast('No se ha seleccionado un cliente válido.', 'danger');
      return;
    }

    this.clienteService.actualizarCliente(this.clienteSeleccionado.curp, this.clienteSeleccionado).subscribe({
      next: () => {
        this.showToast('Cliente actualizado correctamente.', 'success');
        this.cargarClientes();
        this.cancelarEdicion();
      },
      error: (err) => this.mostrarError(err, 'Error al actualizar el cliente.')
    });
  }

  eliminarCliente(curp: string): void {
    if (confirm('¿Seguro que deseas eliminar este cliente?')) {
      this.clienteService.eliminarCliente(curp).subscribe({
        next: () => {
          this.showToast('Cliente eliminado correctamente.', 'success');
          this.cargarClientes();
        },
        error: (err) => this.mostrarError(err, 'Error al eliminar el cliente.')
      });
    }
  }

  cancelarEdicion(): void {
    this.clienteSeleccionado = null;
    this.modoEdicion = false;
    this.mostrarFormulario = false;
  }

  limpiarFormulario(form: NgForm): void {
    form.resetForm();
  }

  validarTelefono(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^0-9]/g, '').slice(0, 10);
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
      if (title) title.textContent = tipo === 'success' ? 'Éxito' : tipo === 'danger' ? 'Error' : 'Advertencia';
      bsToast.show();
    }
  }
  limpiarCurp() {
  if (!this.nuevoCliente.curp) return;

  this.nuevoCliente.curp = this.nuevoCliente.curp
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

limpiarClaveElector() {
  if (!this.nuevoCliente.clave_elector) return;

  this.nuevoCliente.clave_elector = this.nuevoCliente.clave_elector
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}


  mostrarError(err: any, mensajePorDefecto: string): void {
    console.error('Detalles del error:', err);
    let mensaje = mensajePorDefecto;

    if (err.status === 0) mensaje = 'No se puede conectar con el servidor.';
    else if (err.status === 400) mensaje = err.error?.message || 'Datos inválidos.';
    else if (err.status === 404) mensaje = 'El cliente no existe.';
    else if (err.status === 409) mensaje = err.error?.message || 'CURP o correo ya registrados.';
    else if (err.status === 500) mensaje = err.error?.message || 'Error interno del servidor.';

    this.showToast(mensaje, 'danger');
  }
}
