import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router'; // Para usar routerLink
import { Subscription } from 'rxjs';
import { Auth } from '../../services/auth'; // Ajusta la ruta

// Define la interfaz de usuario para usarla en el componente
interface UserData {
  nombre: string;
  nombreCompleto: string;
  rol: string;
  correo: string;
}

@Component({
  selector: 'app-header-admin',
  standalone: true,
  imports: [CommonModule, RouterModule], // Necesitas RouterModule para el [routerLink]
  templateUrl: './header-admin.html',
  styleUrls: ['./header-admin.css']
})
export class HeaderAdmin implements OnInit, OnDestroy {
  // Inicializa a null
  usuario: UserData | null = null; 
  // Propiedad para controlar la suscripción
  private userSubscription!: Subscription;

  constructor(
    private authService: Auth, 
    private router: Router
  ) {}

  ngOnInit(): void {
    // Nos suscribimos al observable del usuario para actualizar el componente
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.usuario = user;
    });
  }

  cerrarSesion(): void {
    this.authService.cerrarSesion();
  }

  ngOnDestroy(): void {
    // Es crucial desuscribirse para evitar fugas de memoria
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }
}