import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PagosService {
  private apiUrl = 'http://localhost:3000/api/pagos'; // Ajusta la URL según tu configuración

  constructor(private http: HttpClient) { }

  getResumen(): Observable<any> {
    return this.http.get(`${this.apiUrl}/resumen`);
  }

  getPagosByContrato(idContrato: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/detalle/${idContrato}`);
  }

  getDetalleContrato(idContrato: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/contrato/${idContrato}`);
  }

  registrarPago(pago: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/registrar`, pago);
  }

  descargarRecibo(pagoId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/recibo/${pagoId}`, {
      responseType: 'blob'
    });
  }

  enviarNotificacionPago(idContrato: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/notificar`, { id_contrato: idContrato });
  }
}