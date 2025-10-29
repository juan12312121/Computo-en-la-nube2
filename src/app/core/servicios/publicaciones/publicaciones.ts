import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

// Interfaces
export interface Publicacion {
  id: number;
  usuario_id: number;
  contenido: string;
  imagen_url?: string;
  imagen_s3?: string;
  categoria?: string;
  color_categoria?: string;
  nombre_usuario?: string;
  nombre_completo?: string;
  foto_perfil_url?: string;
  fecha_creacion: string;
  oculto: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class PublicacionesService {
  private apiUrl: string;

  constructor(private http: HttpClient) {
    const host = window.location.hostname;
    this.apiUrl = host === 'localhost' || host === '127.0.0.1'
      ? 'http://localhost:3000/api/publicaciones'
      : 'http://13.59.190.199:3000/api/publicaciones';
  }

  // Construir headers con token
  private getHeaders(): { headers?: HttpHeaders } {
    const token = localStorage.getItem('token');
    if (token) {
      return { headers: new HttpHeaders({ 'Authorization': `Bearer ${token}` }) };
    }
    return {};
  }

  // Crear publicación
  crearPublicacion(publicacion: FormData): Observable<ApiResponse<Publicacion>> {
    return this.http.post<ApiResponse<Publicacion>>(this.apiUrl, publicacion, this.getHeaders());
  }

  // Obtener feed general
  obtenerPublicaciones(): Observable<ApiResponse<Publicacion[]>> {
    return this.http.get<ApiResponse<Publicacion[]>>(this.apiUrl, this.getHeaders());
  }

  // Obtener publicación por ID
  obtenerPublicacion(id: number): Observable<ApiResponse<Publicacion>> {
    return this.http.get<ApiResponse<Publicacion>>(`${this.apiUrl}/${id}`, this.getHeaders());
  }

  // CORREGIDO: Obtener mis publicaciones
  obtenerMisPublicaciones(): Observable<ApiResponse<Publicacion[]>> {
    return this.http.get<ApiResponse<Publicacion[]>>(`${this.apiUrl}/mis-publicaciones`, this.getHeaders());
  }

  // Obtener publicaciones de otro usuario
  obtenerPublicacionesUsuario(usuarioId: number): Observable<ApiResponse<Publicacion[]>> {
    return this.http.get<ApiResponse<Publicacion[]>>(`${this.apiUrl}/usuario/${usuarioId}`, this.getHeaders());
  }

  // Actualizar publicación
  actualizarPublicacion(id: number, publicacion: FormData): Observable<ApiResponse<Publicacion>> {
    return this.http.put<ApiResponse<Publicacion>>(`${this.apiUrl}/${id}`, publicacion, this.getHeaders());
  }

  // Eliminar publicación
  eliminarPublicacion(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/${id}`, this.getHeaders());
  }

  // Helper: Crear FormData
  crearFormData(datos: {
    contenido: string;
    categoria?: string;
    color_categoria?: string;
    imagen?: File;
  }): FormData {
    const formData = new FormData();
    formData.append('contenido', datos.contenido);
    if (datos.categoria) formData.append('categoria', datos.categoria);
    if (datos.color_categoria) formData.append('color_categoria', datos.color_categoria);
    if (datos.imagen) formData.append('imagen', datos.imagen);
    return formData;
  }
}