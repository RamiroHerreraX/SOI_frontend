import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoteService {

  private apiUrl = 'http://localhost:3000/api/lotes';

  constructor(private http: HttpClient) { }

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  create(lote: FormData): Observable<any> {
    return this.http.post<any>(this.apiUrl, lote);
  }

  update(id: number, lote: FormData): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, lote);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
