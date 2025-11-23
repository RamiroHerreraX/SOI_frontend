import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ContratoService {

   private apiUrl = 'http://localhost:3000/api/'; // ajusta tu puerto/backend

  constructor(private http: HttpClient) {}

  crearContrato(data: any): Observable<any> {
    return this.http.post(`contratos/${this.apiUrl}/crear`, data);
  }

  obtenerContratos(): Observable<any[]> {
    return this.http.get<any[]>(`contratos/${this.apiUrl}`);
  }

  buscarClientePorCorreo(correo: string) {
  return this.http.get<any>(`${this.apiUrl}clientes/buscar-por-correo?correo=${correo}`);
}

}
