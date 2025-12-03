import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { UsersService, User } from '../../services/users.service';
import { HeaderAdmin } from "../../shared/header-admin/header-admin";
import { FooterAdmin } from "../../shared/footer-admin/footer-admin";
import { UserFilterPipe } from '../../pipes/user-filter.pipe';
import { ScrollTopComponent } from "../scroll-top/scroll-top.component";

declare var bootstrap: any;

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderAdmin, FooterAdmin, UserFilterPipe,ScrollTopComponent],
  templateUrl: './usuarios.html',
  styleUrls: ['./usuarios.css']
})
export class Usuarios implements OnInit {

  usuarios: User[] = [];
  usuariosFiltrados: User[] = [];

  usuarioSeleccionado: User | null = null;
  modoEdicion = false;
  mostrarFormulario = false;

  // 🔹 Filtros
  filtroNombre = '';
  filtroCorreo = '';
  filtroTelefono = '';
  filtroRol = '';

  // 🔹 Usuario nuevo
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

  // ================================
  // 🔹 Cargar todos los usuarios
  // ================================
  cargarUsuarios(): void {
    this.usersService.getUsers().subscribe({
      next: (data) => {
        console.log('✅ Usuarios cargados:', data);
        this.usuarios = data;
        this.usuariosFiltrados = data;
      },
      error: (err) => this.mostrarError(err, 'Error al cargar los usuarios.')
    });
  }

  // ================================
  // 🔹 Crear nuevo usuario
  // ================================
  crearUsuario(form: NgForm): void {

      if (form.invalid) {
    this.showToast('Por favor completa correctamente todos los campos requeridos.', 'warning');
    return;
  }

  const pass = this.nuevoUsuario.password;

  const regexPass = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*._-]).{8,32}$/;

  if (!regexPass.test(pass)) {
    this.showToast('La contraseña debe tener mayúscula, minúscula, número y carácter especial.', 'warning');
    return;
  }
  
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
    this.mostrarFormulario = true;
  }

  // ================================
  // 🔹 Actualizar usuario
  // ================================
  actualizarUsuario(): void {
    if (!this.usuarioSeleccionado?.id_user) {
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
    this.mostrarFormulario = false;
  }

  // ================================
  // 🔹 Limpiar formulario
  // ================================
  limpiarFormulario(form: NgForm): void {
    form.resetForm({ rol: 'secretaria' });
  }

  // ================================
  // 🔹 Validar teléfono
  // ================================
  validarTelefono(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^0-9]/g, '').slice(0, 10);
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

      // Reset y aplicar color
      toastEl.className = toastEl.className.replace(/\btext-bg-\S+/g, '');
      toastEl.classList.add(`text-bg-${tipo}`);

      if (title) {
        title.textContent =
          tipo === 'success' ? 'Éxito' :
          tipo === 'danger' ? 'Error' :
          '⚠️ Advertencia';
      }

      bsToast.show();
    }
  }

  // ================================
  // 🔹 Manejo centralizado de errores
  // ================================
  mostrarError(err: any, mensajePorDefecto: string): void {
    console.error(' Detalles del error:', err);

    let mensaje = mensajePorDefecto;

    if (err.status === 0) {
      mensaje = 'No se puede conectar con el servidor. Verifica tu conexión.';
    } else if (err.status === 400) {
      mensaje = err.error?.message || 'Solicitud incorrecta. Verifica los datos enviados.';
    } else if (err.status === 404) {
      mensaje = 'El recurso solicitado no existe.';
    } else if (err.status === 409) {
      mensaje = err.error?.message || 'El correo o teléfono ya están registrados.';
    } else if (err.status === 500) {
      // 🔸 Caso que mencionas específicamente:
      // HttpErrorResponse 500 con message "El correo o teléfono ya están registrados."
      if (err.error?.message?.includes('registrados')) {
        mensaje = 'El correo o teléfono ya están registrados. Por favor verifica los datos.';
      } else {
        mensaje = err.error?.message || 'Error interno del servidor. Intenta nuevamente.';
      }
    } else {
      mensaje = err.error?.message || mensajePorDefecto;
    }

    this.showToast(mensaje, 'danger');
  }
}
