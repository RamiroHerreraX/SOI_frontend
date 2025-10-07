import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsersService {

  private apiUrl = 'http://localhost:3000/api/users';

  constructor(private http: HttpClient) {}

  getEncargados(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}?rol=encargado`);
  }
}
