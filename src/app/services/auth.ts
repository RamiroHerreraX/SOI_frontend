import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';

export interface UserData {
  nombre: string;
  nombreCompleto: string;
  rol: string;
  correo: string;
}

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private currentUserSubject: BehaviorSubject<UserData | null>;
  public currentUser$: Observable<UserData | null>;
  private apiUrl = 'http://localhost:3000/api/auth'; // Ajusta al puerto de tu backend

  constructor(private http: HttpClient, private router: Router) {
    const user = localStorage.getItem('currentUser');
    this.currentUserSubject = new BehaviorSubject<UserData | null>(user ? JSON.parse(user) : null);
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): UserData | null {
    return this.currentUserSubject.value;
  }

  // ---------------- LOGIN ----------------
  login(credentials: { correo: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials);
  }

  // ---------------- VERIFY OTP ----------------
 verifyOtp(payload: { correo: string; otp: string }): Observable<any> {
  return this.http.post<{ token: string; user: UserData }>(`${this.apiUrl}/verify-otp`, payload).pipe(
    tap((res) => {
      if (res.token) {
        localStorage.setItem('token', res.token);
      }
      if (res.user) {
        localStorage.setItem('currentUser', JSON.stringify(res.user));
        this.currentUserSubject.next(res.user);
      }
    })
  );
}


  // ---------------- CERRAR SESIÓN ----------------
  cerrarSesion(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  estaLogeado(): boolean {
    return !!this.currentUserSubject.value;
  }
}
