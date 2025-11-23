import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';

// Asume que este servicio existe y tiene la lógica de validación
import { Auth } from '../services/auth'; 

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: Auth, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    // 1. Verificar el token (Lógica de tu servicio Auth)
    // El servicio Auth debe tener un método que revise si el JWT existe 
    // y si es válido/no ha expirado.
    if (this.authService.estaLogeado()) {
      return true; // Permitir acceso
    } else {
      // 2. Bloquear y Redirigir
      // Si no ha iniciado sesión, envía una alerta y lo redirige a la página de login.
      this.router.navigate(['/login']); 
      return false; // Bloquea la navegación
    }
  }
}