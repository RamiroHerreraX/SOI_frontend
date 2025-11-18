import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Cliente {
  nombre: string;
  apellido_paterno: string;
  apellido_materno?: string;
  correo: string;
  telefono?: string;
  curp: string;
  clave_elector?: string;
  doc_identificacion?: File | null;  
  doc_curp?: File | null;
}

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private apiUrl = 'http://localhost:3000/api/clientes';

  constructor(private http: HttpClient) {}

  /** Obtener todos los clientes */
  getClientes(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(`${this.apiUrl}`);
  }

  /** Obtener cliente por CURP */
  getClientePorCurp(curp: string): Observable<Cliente> {
    return this.http.post<Cliente>(`${this.apiUrl}/obtener`, { curp });
  }

  /** Crear nuevo cliente */
  crearCliente(cliente: Cliente): Observable<Cliente> {
    return this.http.post<Cliente>(`${this.apiUrl}`, cliente);
  }

  /** Actualizar cliente por CURP */
  actualizarCliente(curp: string, datos: Partial<Cliente>): Observable<any> {
    return this.http.put(`${this.apiUrl}/actualizar`, { curp, datos });
  }

  /** Eliminar cliente por CURP */
  eliminarCliente(curp: string): Observable<any> {
    return this.http.request('delete', `${this.apiUrl}/eliminar`, { body: { curp } });
  }
}
