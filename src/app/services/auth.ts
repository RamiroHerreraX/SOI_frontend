import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

// Define una interfaz para los datos del usuario (ajusta los campos según tu API)
interface UserData {
  nombre: string;
  nombreCompleto: string;
  rol: string;
  correo: string;
}

@Injectable({
  providedIn: 'root'
})
export class Auth {
  // BehaviorSubject para almacenar y emitir el estado de la sesión
  private currentUserSubject: BehaviorSubject<UserData | null>;
  public currentUser$: Observable<UserData | null>;
  
  // Puedes usar una URL base si no la tienes ya definida
  // private apiUrl = 'URL_DE_TU_API/auth'; 

  constructor(private http: HttpClient, private router: Router) {
    // Intenta cargar el usuario desde el almacenamiento local al iniciar
    const user = localStorage.getItem('currentUser');
    this.currentUserSubject = new BehaviorSubject<UserData | null>(user ? JSON.parse(user) : null);
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): UserData | null {
    return this.currentUserSubject.value;
  }

  // --- MÉTODOS DE AUTENTICACIÓN ---

  login(credentials: any): Observable<any> {
    // Ejemplo de llamada POST (Asume que devuelve un token y los datos del usuario)
    // return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
    //   tap(response => {
            // Suponemos que la respuesta es { token: '...', user: UserData }
            const fakeUser: UserData = { 
                nombre: 'Juan', 
                nombreCompleto: 'Juan Pérez', 
                rol: 'Administrador', 
                correo: credentials.email 
            };
            localStorage.setItem('currentUser', JSON.stringify(fakeUser));
            this.currentUserSubject.next(fakeUser);
    //         return response;
    //   })
    // );
    
   
    localStorage.setItem('currentUser', JSON.stringify(fakeUser));
    this.currentUserSubject.next(fakeUser);
    // Retorna un observable simulado (debes reemplazar esto con la llamada HTTP real)
    return new Observable(observer => { observer.next({ success: true }); observer.complete(); });
  }

  cerrarSesion(): void {
    // 1. Eliminar el token o usuario del almacenamiento local
    localStorage.removeItem('currentUser');
    // 2. Notificar a los suscriptores que ya no hay usuario
    this.currentUserSubject.next(null);
    // 3. Redirigir al login
    this.router.navigate(['/auth/login']);
  }

  estaLogeado(): boolean {
    return this.currentUserSubject.value !== null;
  }
}