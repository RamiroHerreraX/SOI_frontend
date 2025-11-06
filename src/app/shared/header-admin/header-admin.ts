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
  usuario: UserData | null = null; 
  private userSubscription!: Subscription;

  menuOpen = false;       // Controla collapse del menú en mobile
  dropdownOpen = false;   // Controla dropdown de usuario

  constructor(private authService: Auth, private router: Router) {}

  ngOnInit(): void {
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.usuario = user;
      // Si el usuario no está logeado, cerramos el dropdown
      if (!user) this.dropdownOpen = false;
    });
  }

  cerrarSesion(): void {
    this.authService.cerrarSesion();
  }

  ngOnDestroy(): void {
    if (this.userSubscription) this.userSubscription.unsubscribe();
  }
}
