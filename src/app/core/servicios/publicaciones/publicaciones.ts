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

export interface Categoria {
  value: string;
  label: string;
  color: string;
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

  // ✅ NUEVO: Obtener categorías disponibles
  obtenerCategorias(): Observable<ApiResponse<Categoria[]>> {
    return this.http.get<ApiResponse<Categoria[]>>(`${this.apiUrl}/categorias`);
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

  // Obtener mis publicaciones
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

  // Helper: Crear FormData (YA NO NECESITAS enviar color_categoria)
  crearFormData(datos: {
    contenido: string;
    categoria?: string;
    imagen?: File;
  }): FormData {
    const formData = new FormData();
    formData.append('contenido', datos.contenido);
    if (datos.categoria) formData.append('categoria', datos.categoria);
    // ❌ color_categoria removido - se asigna automáticamente en el backend
    if (datos.imagen) formData.append('imagen', datos.imagen);
    return formData;
  }

  // ✅ NUEVO: Helper para obtener el color de una categoría
  obtenerColorCategoria(categoria: string): string {
    const colores: { [key: string]: string } = {
      'General': 'bg-orange-500',
      'Tecnología': 'bg-teal-500',
      'Ciencias': 'bg-purple-500',
      'Artes y Cultura': 'bg-pink-500',
      'Deportes': 'bg-blue-500',
      'Salud y Bienestar': 'bg-green-500',
      'Vida Universitaria': 'bg-orange-600',
      'Opinión': 'bg-indigo-500',
      'Entrevistas': 'bg-yellow-500'
    };
    return colores[categoria] || 'bg-orange-500';
  }
}