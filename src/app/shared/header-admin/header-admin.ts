import { Component } from '@angular/core';

@Component({
  selector: 'app-header-admin',
  imports: [],
  templateUrl: './header-admin.html',
  styleUrl: './header-admin.css'
})
export class HeaderAdmin {
  // Simulación de usuario logueado
  usuario = { nombre: 'Juan Díaz', rol: 'Administrador' };

  cerrarSesion() {
    // Aquí va la lógica para cerrar sesión, limpiar token, etc.
    console.log('Cerrando sesión...');
    // Redirigir a login
    window.location.href = '/login';
  }
}
