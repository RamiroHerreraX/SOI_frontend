import { 
  Component, OnInit, OnDestroy, HostListener, 
  ElementRef, ViewChild 
} from '@angular/core';
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

  // Obtiene la referencia al elemento <li> del dropdown mediante la variable de plantilla #dropdownMenu
  // Usamos static: false para asegurar que Angular lo busque después de que *ngIf lo muestre.
  @ViewChild('dropdownMenu', { static: false }) dropdownMenuRef!: ElementRef;

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

 
/**
   * Escucha clics en todo el documento para cerrar el dropdown de usuario
   * si el clic no ocurrió dentro del elemento del dropdown.
   */
  @HostListener('document:click', ['$event'])
  hostClick(event: MouseEvent): void {
    // 🛑 COMPROBACIÓN DE SEGURIDAD CLAVE: Si el dropdown no está abierto O la referencia no existe, salimos.
    if (!this.dropdownOpen || !this.dropdownMenuRef) return;

    // 1. Verificar si el clic ocurrió DENTRO del elemento del dropdown (el <li>)
    const clickedInsideDropdown = this.dropdownMenuRef.nativeElement.contains(event.target as Node);

    // 2. Si el clic NO fue dentro, cerramos el dropdown.
    if (!clickedInsideDropdown) {
      this.dropdownOpen = false;
    }
  }
}