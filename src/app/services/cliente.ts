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
  private pdfUrl = 'http://localhost:3000/pdfs/'; 
  constructor(private http: HttpClient) {}

  /** Obtener URL pública de un PDF */

getPdfUrl(nombreArchivo: string): string {
  return `${this.pdfUrl}${nombreArchivo}`;
}



  /** Obtener todos los clientes */
  getClientes(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(`${this.apiUrl}`);
  }

  /** Obtener cliente por CURP */
  getClientePorCurp(curp: string): Observable<Cliente> {
    return this.http.post<Cliente>(`${this.apiUrl}/obtener`, { curp });
  }

  /** Crear nuevo cliente */
  crearCliente(cliente: Cliente): Observable<any> {
  const formData = new FormData();

  formData.append("nombre", cliente.nombre);
  formData.append("apellido_paterno", cliente.apellido_paterno);
  formData.append("apellido_materno", cliente.apellido_materno || "");
  formData.append("correo", cliente.correo);
  formData.append("telefono", cliente.telefono || "");
  formData.append("curp", cliente.curp);
  formData.append("clave_elector", cliente.clave_elector || "");

  if (cliente.doc_identificacion)
      formData.append("doc_identificacion", cliente.doc_identificacion);

  if (cliente.doc_curp)
      formData.append("doc_curp", cliente.doc_curp);

  return this.http.post(`${this.apiUrl}`, formData);
}


  /** Actualizar cliente por CURP */
actualizarCliente(cliente: any): Observable<any> {
  const formData = new FormData();

  formData.append("curp", cliente.curp);
  formData.append("nombre", cliente.nombre);
  formData.append("apellido_paterno", cliente.apellido_paterno);
  formData.append("apellido_materno", cliente.apellido_materno || "");
  formData.append("correo", cliente.correo);
  formData.append("telefono", cliente.telefono || "");
  formData.append("clave_elector", cliente.clave_elector || "");

  if (cliente.doc_identificacion)
    formData.append("doc_identificacion", cliente.doc_identificacion);

  if (cliente.doc_curp)
    formData.append("doc_curp", cliente.doc_curp);

  return this.http.put(`${this.apiUrl}/actualizar`, formData);
}


  /** Eliminar cliente por CURP */
  eliminarCliente(curp: string): Observable<any> {
    return this.http.request('delete', `${this.apiUrl}/eliminar`, { body: { curp } });
  }
}
