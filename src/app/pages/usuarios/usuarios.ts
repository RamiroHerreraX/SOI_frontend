import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { UsersService, User } from '../../services/users.service';
import { HeaderAdmin } from "../../shared/header-admin/header-admin";
import { FooterAdmin } from "../../shared/footer-admin/footer-admin";

declare var bootstrap: any;

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderAdmin, FooterAdmin],
  templateUrl: './usuarios.html',
  styleUrls: ['./usuarios.css']
})
export class Usuarios implements OnInit {

  usuarios: User[] = [];
  usuarioSeleccionado: User | null = null;
  modoEdicion = false;

  filtroNombre: string = '';
  filtroCorreo: string = '';
  filtroTelefono: string = '';
  filtroRol: string = '';

  nuevoUsuario: User = {
    usuario: '',
    password: '',
    rol: 'secretaria',
    correo: '',
    telefono: ''
  };

  constructor(private usersService: UsersService) {}

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  // 🔹 Filtro dinámico sin Pipe
  get usuariosFiltrados(): User[] {
    return this.usuarios.filter(u =>
      u.usuario.toLowerCase().includes(this.filtroNombre.toLowerCase()) &&
      u.correo.toLowerCase().includes(this.filtroCorreo.toLowerCase()) &&
      u.telefono.toLowerCase().includes(this.filtroTelefono.toLowerCase()) &&
      u.rol.toLowerCase().includes(this.filtroRol.toLowerCase())
    );
  }

  // ================================
  // 🔹 Cargar todos los usuarios
  // ================================
  cargarUsuarios(): void {
    this.usersService.getUsers().subscribe({
      next: (data) => this.usuarios = data,
      error: (err) => this.mostrarError(err, 'Error al cargar los usuarios.')
    });
  }

  // ================================
  // 🔹 Crear nuevo usuario
  // ================================
  crearUsuario(form: NgForm): void {
    if (form.invalid) {
      this.showToast('Por favor completa todos los campos requeridos.', 'warning');
      return;
    }

    if (this.nuevoUsuario.password.length < 6) {
      this.showToast('La contraseña debe tener al menos 6 caracteres.', 'warning');
      return;
    }

    this.usersService.createUser(this.nuevoUsuario).subscribe({
      next: () => {
        this.showToast('Usuario creado correctamente.', 'success');
        this.cargarUsuarios();
        this.limpiarFormulario(form);
      },
      error: (err) => this.mostrarError(err, 'Error al crear el usuario.')
    });
  }

  // ================================
  // 🔹 Editar usuario
  // ================================
  editarUsuario(usuario: User): void {
    this.usuarioSeleccionado = { ...usuario };
    this.modoEdicion = true;
  }

  // ================================
  // 🔹 Actualizar usuario
  // ================================
  actualizarUsuario(): void {
    if (!this.usuarioSeleccionado || !this.usuarioSeleccionado.id_user) {
      this.showToast('No se ha seleccionado un usuario válido.', 'danger');
      return;
    }

    this.usersService.updateUser(this.usuarioSeleccionado.id_user, this.usuarioSeleccionado).subscribe({
      next: () => {
        this.showToast('Usuario actualizado correctamente.', 'success');
        this.cargarUsuarios();
        this.cancelarEdicion();
      },
      error: (err) => this.mostrarError(err, 'Error al actualizar el usuario.')
    });
  }

  // ================================
  // 🔹 Eliminar usuario
  // ================================
  eliminarUsuario(id: number): void {
    if (confirm('¿Seguro que deseas eliminar este usuario?')) {
      this.usersService.deleteUser(id).subscribe({
        next: () => {
          this.showToast('Usuario eliminado correctamente.', 'success');
          this.cargarUsuarios();
        },
        error: (err) => this.mostrarError(err, 'Error al eliminar el usuario.')
      });
    }
  }

  // ================================
  // 🔹 Cancelar edición
  // ================================
  cancelarEdicion(): void {
    this.usuarioSeleccionado = null;
    this.modoEdicion = false;
  }

  // ================================
  // 🔹 Limpiar formulario
  // ================================
  limpiarFormulario(form: NgForm): void {
    form.resetForm({
      rol: 'secretaria'
    });
  }

  // ================================
  // 🔹 Mostrar notificaciones Toast
  // ================================
  showToast(mensaje: string, tipo: 'success' | 'danger' | 'warning' = 'success'): void {
    const toastEl = document.getElementById('liveToast');
    if (toastEl) {
      const bsToast = new bootstrap.Toast(toastEl);
      const body = toastEl.querySelector('.toast-body');
      const title = toastEl.querySelector('.toast-title');

      if (body) body.innerHTML = mensaje;

      toastEl.className = toastEl.className.replace(/\btext-bg-\S+/g, '');
      toastEl.classList.add(`text-bg-${tipo}`);

      if (title) {
        title.textContent =
          tipo === 'success' ? 'Éxito' :
          tipo === 'danger' ? 'Error' :
          'Advertencia';
      }

      bsToast.show();
    }
  }

  // ================================
  // 🔹 Manejo centralizado de errores
  // ================================
  mostrarError(err: any, mensajePorDefecto: string): void {
    console.error('Detalles del error:', err);

    let mensaje = mensajePorDefecto;

    if (err.status === 0) {
      mensaje = '❌ No se puede conectar con el servidor. Verifica tu conexión.';
    } else if (err.status === 400) {
      mensaje = err.error?.message || 'Solicitud incorrecta. Verifica los datos.';
    } else if (err.status === 404) {
      mensaje = 'Recurso no encontrado.';
    } else if (err.status === 409) {
      mensaje = err.error?.message || 'El correo o teléfono ya están registrados.';
    } else if (err.status === 500) {
      mensaje = err.error?.message || 'Error interno del servidor.';
    }

    this.showToast(mensaje, 'danger');
  }

  validarTelefono(event: Event): void {
  const input = event.target as HTMLInputElement;
  // Reemplaza cualquier carácter que no sea número
  input.value = input.value.replace(/[^0-9]/g, '');
  // Si el usuario pega más de 10 dígitos, los corta
  if (input.value.length > 10) {
    input.value = input.value.slice(0, 10);
  }
}
}
