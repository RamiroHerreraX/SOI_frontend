import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UbicacionService {
  // URL base del backend
  private baseUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  getEstados(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/estados`); // consume http://localhost:3000/api/estados
  }

  getCiudades(estadoId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/ciudades/${estadoId}`); 
  }

  getColonias(ciudadId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/colonias/${ciudadId}`); 
  }
}
