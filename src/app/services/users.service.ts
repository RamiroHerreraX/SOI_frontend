import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface User {
  id_user?: number;
  usuario: string;
  password: string;
  rol: 'secretaria' | 'encargado';
  correo: string;
  telefono: string;
}

@Injectable({
  providedIn: 'root'
})
export class UsersService {

  private apiUrl = 'http://localhost:3000/api/users';

  constructor(private http: HttpClient) {}

  // ==========================
  // 🔹 Obtener todos los usuarios o filtrados por rol
  // ==========================
  getUsers(rol?: string): Observable<User[]> {
    const url = rol ? `${this.apiUrl}?rol=${rol}` : this.apiUrl;
    return this.http.get<User[]>(url);
  }

  // ==========================
  // 🔹 Obtener un usuario por ID
  // ==========================
  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  // ==========================
  // 🔹 Crear usuario (ALTA)
  // ==========================
  createUser(user: User): Observable<User> {
    return this.http.post<User>(this.apiUrl, user);
  }

  // ==========================
  // 🔹 Actualizar usuario
  // ==========================
  updateUser(id: number, user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, user);
  }

  // ==========================
  // 🔹 Eliminar usuario
  // ==========================
  deleteUser(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  // ==========================
  // 🔹 Obtener solo encargados (opcional)
  // ==========================
  getEncargados(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}?rol=encargado`);
  }

  // 🔹 Obtener solo secretarias (opcional)
  getSecretarias(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}?rol=secretaria`);
  }
}
