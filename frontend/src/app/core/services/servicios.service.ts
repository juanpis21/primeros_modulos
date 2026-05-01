import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Servicio {
  id: number;
  nombre: string;
  descripcion: string;
  precioBase: number;
  duracionMinutos?: number;
  tipoServicio: string;
  requiereCita: boolean;
  isActive: boolean;
  veterinariaId: number;
  imagen?: string;
  etiquetas?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ServiciosService {
  private apiUrl = 'http://localhost:3000/servicios';

  constructor(private http: HttpClient) {}

  private getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getAll(): Observable<Servicio[]> {
    return this.http.get<Servicio[]>(this.apiUrl, { headers: this.getAuthHeaders() });
  }

  getOne(id: number): Observable<Servicio> {
    return this.http.get<Servicio>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }

  create(servicio: any): Observable<Servicio> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`
    });
    
    if (servicio instanceof FormData) {
      return this.http.post<Servicio>(this.apiUrl, servicio, { headers });
    }
    return this.http.post<Servicio>(this.apiUrl, servicio, { headers: this.getAuthHeaders() });
  }

  update(id: number, servicio: any): Observable<Servicio> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`
    });

    if (servicio instanceof FormData) {
      return this.http.patch<Servicio>(`${this.apiUrl}/${id}`, servicio, { headers });
    }
    return this.http.patch<Servicio>(`${this.apiUrl}/${id}`, servicio, { headers: this.getAuthHeaders() });
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }
}
