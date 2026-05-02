import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  codigoBarras?: string;
  stockActual: number;
  stockMinimo: number;
  stockMaximo?: number;
  precioCompra: number;
  precioVenta: number;
  fechaVencimiento?: string;
  unidadMedida: string;
  lote?: string;
  ubicacion?: string;
  isActive: boolean;
  categoriaId: number;
  veterinariaId: number;
  veterinaria?: any;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductosService {
  private apiUrl = 'http://localhost:3000/productos';

  constructor(private http: HttpClient) {}

  private getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getAll(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.apiUrl, { headers: this.getAuthHeaders() });
  }

  getOne(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }

  create(producto: Partial<Producto>): Observable<Producto> {
    return this.http.post<Producto>(this.apiUrl, producto, { headers: this.getAuthHeaders() });
  }

  update(id: number, producto: Partial<Producto>): Observable<Producto> {
    return this.http.patch<Producto>(`${this.apiUrl}/${id}`, producto, { headers: this.getAuthHeaders() });
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }
}
