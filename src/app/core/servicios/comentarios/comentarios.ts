import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AutenticacionService } from '../autenticacion/autenticacion';

// Interfaces
export interface Comentario {
  id: number;
  publicacion_id: number;
  usuario_id: number;
  texto: string;
  fecha_creacion: string;
  nombre_usuario: string;
  nombre_completo: string;
  foto_perfil_url?: string;
  foto_perfil_s3?: string;
}

export interface ComentarioRequest {
  publicacion_id: number;
  texto: string;
}

export interface ComentarioUpdateRequest {
  texto: string;
}

export interface ComentarioResponse {
  success: boolean;
  message?: string;
  mensaje?: string;
  data?: Comentario;
}

export interface ComentariosListResponse {
  success: boolean;
  data: Comentario[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ComentariosService {
  private apiUrl: string;

  constructor(
    private http: HttpClient,
    private autenticacionService: AutenticacionService
  ) {
    const host = window.location.hostname;

    if (host === 'localhost' || host === '127.0.0.1') {
      this.apiUrl = 'http://localhost:3000/api/comentarios';
    } else {
      this.apiUrl = 'http://3.146.83.30:3000/api/comentarios';
    }
  }

  /**
   * Obtiene los headers con el token de autenticación
   * @returns HttpHeaders con el token
   */
  private getHeaders(): HttpHeaders {
    const token = this.autenticacionService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Crear un nuevo comentario
   * @param datos - Datos del comentario (publicacion_id, texto)
   * @returns Observable con la respuesta del servidor
   */
  crear(datos: ComentarioRequest): Observable<ComentarioResponse> {
    return this.http.post<ComentarioResponse>(
      this.apiUrl, 
      datos, 
      { headers: this.getHeaders() }
    );
  }

  /**
   * Obtener comentarios de una publicación específica
   * @param publicacionId - ID de la publicación
   * @param limit - Cantidad de comentarios a obtener (default: 50)
   * @param offset - Desde qué comentario empezar (default: 0)
   * @returns Observable con lista de comentarios
   */
  obtenerPorPublicacion(
    publicacionId: number, 
    limit: number = 50, 
    offset: number = 0
  ): Observable<ComentariosListResponse> {
    let params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString());

    return this.http.get<ComentariosListResponse>(
      `${this.apiUrl}/publicacion/${publicacionId}`,
      { params, headers: this.getHeaders() }
    );
  }

  /**
   * Obtener comentarios de un usuario específico
   * @param usuarioId - ID del usuario
   * @param limit - Cantidad de comentarios a obtener (default: 50)
   * @param offset - Desde qué comentario empezar (default: 0)
   * @returns Observable con lista de comentarios
   */
  obtenerPorUsuario(
    usuarioId: number, 
    limit: number = 50, 
    offset: number = 0
  ): Observable<ComentariosListResponse> {
    let params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString());

    return this.http.get<ComentariosListResponse>(
      `${this.apiUrl}/usuario/${usuarioId}`,
      { params, headers: this.getHeaders() }
    );
  }

  /**
   * Obtener un comentario específico por ID
   * @param id - ID del comentario
   * @returns Observable con el comentario
   */
  obtenerPorId(id: number): Observable<ComentarioResponse> {
    return this.http.get<ComentarioResponse>(
      `${this.apiUrl}/${id}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Actualizar un comentario
   * @param id - ID del comentario
   * @param datos - Nuevos datos del comentario (texto)
   * @returns Observable con la respuesta del servidor
   */
  actualizar(id: number, datos: ComentarioUpdateRequest): Observable<ComentarioResponse> {
    return this.http.put<ComentarioResponse>(
      `${this.apiUrl}/${id}`, 
      datos,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Eliminar un comentario
   * @param id - ID del comentario
   * @returns Observable con la respuesta del servidor
   */
  eliminar(id: number): Observable<ComentarioResponse> {
    return this.http.delete<ComentarioResponse>(
      `${this.apiUrl}/${id}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Cargar más comentarios (para infinite scroll)
   * @param publicacionId - ID de la publicación
   * @param comentariosActuales - Array de comentarios actuales
   * @param limit - Cantidad de comentarios a cargar
   * @returns Observable con los nuevos comentarios
   */
  cargarMasComentarios(
    publicacionId: number, 
    comentariosActuales: Comentario[], 
    limit: number = 20
  ): Observable<ComentariosListResponse> {
    const offset = comentariosActuales.length;
    return this.obtenerPorPublicacion(publicacionId, limit, offset);
  }
}