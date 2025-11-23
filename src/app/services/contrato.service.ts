import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ContratoService {

   private apiUrl = 'http://localhost:3000/api/';

  constructor(private http: HttpClient) {}

  crearContrato(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}contratos/crear`, data);
  }

  obtenerContratos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}contratos`);
  }

    buscarClientePorCorreo(correo: string) {
    return this.http.get<any>(`${this.apiUrl}clientes/buscar-por-correo?correo=${correo}`);
  }

  obtenerLoteParaContrato(id: number) {
    return this.http.get<any>(`${this.apiUrl}lotes/lote-contrato/${id}`);
  }


}
