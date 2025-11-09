import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
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

    console.log('🔧 ComentariosService inicializado');
    console.log('📍 API URL:', this.apiUrl);
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
    console.log('📝 Creando comentario para publicación:', datos.publicacion_id);
    
    return this.http.post<ComentarioResponse>(
      this.apiUrl, 
      datos, 
      { headers: this.getHeaders() }
    ).pipe(
      map(response => {
        console.log('✅ Comentario creado:', response);
        return response;
      }),
      catchError(error => {
        console.error('❌ Error al crear comentario:', error);
        throw error;
      })
    );
  }

  /**
   * Obtener comentarios de una publicación específica
   * ✅ CORREGIDO: Extrae el array de comentarios de la respuesta
   * 
   * @param publicacionId - ID de la publicación
   * @param limit - Cantidad de comentarios a obtener (default: 50)
   * @param offset - Desde qué comentario empezar (default: 0)
   * @returns Observable con lista de comentarios (ARRAY PURO)
   */
  obtenerPorPublicacion(
    publicacionId: number, 
    limit: number = 50, 
    offset: number = 0
  ): Observable<Comentario[]> {
    console.log('📥 Obteniendo comentarios de publicación:', {
      publicacionId,
      limit,
      offset
    });

    let params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString());

    return this.http.get<any>(
      `${this.apiUrl}/publicacion/${publicacionId}`,
      { params, headers: this.getHeaders() }
    ).pipe(
      map(response => {
        console.log('📦 Respuesta recibida:', response);
        
        // ✅ VALIDAR ESTRUCTURA
        if (!response.success) {
          console.warn('⚠️ Respuesta no exitosa:', response.mensaje);
          return [];
        }

        // ✅ EXTRAER COMENTARIOS DEL OBJETO
        const comentariosArray = response.data?.comentarios;
        
        console.log('🔍 Tipo de comentariosArray:', typeof comentariosArray, 'Es array:', Array.isArray(comentariosArray));

        if (!Array.isArray(comentariosArray)) {
          console.warn('⚠️ comentarios no es array:', comentariosArray);
          return [];
        }

        console.log('✅ Comentarios extraídos:', comentariosArray.length);
        return comentariosArray;
      }),
      catchError(error => {
        console.error('❌ Error obteniendo comentarios:', error);
        return of([]); // Devolver array vacío en caso de error
      })
    );
  }

  /**
   * Obtener comentarios de un usuario específico
   * @param usuarioId - ID del usuario
   * @param limit - Cantidad de comentarios a obtener (default: 50)
   * @param offset - Desde qué comentario empezar (default: 0)
   * @returns Observable con lista de comentarios (ARRAY PURO)
   */
  obtenerPorUsuario(
    usuarioId: number, 
    limit: number = 50, 
    offset: number = 0
  ): Observable<Comentario[]> {
    console.log('👤 Obteniendo comentarios del usuario:', usuarioId);

    let params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString());

    return this.http.get<any>(
      `${this.apiUrl}/usuario/${usuarioId}`,
      { params, headers: this.getHeaders() }
    ).pipe(
      map(response => {
        if (response.success && Array.isArray(response.data?.comentarios)) {
          return response.data.comentarios;
        }
        return [];
      }),
      catchError(error => {
        console.error('❌ Error al obtener comentarios del usuario:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtener un comentario específico por ID
   * @param id - ID del comentario
   * @returns Observable con el comentario
   */
  obtenerPorId(id: number): Observable<ComentarioResponse> {
    console.log('🔍 Obteniendo comentario ID:', id);

    return this.http.get<ComentarioResponse>(
      `${this.apiUrl}/${id}`,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.error('❌ Error al obtener comentario:', error);
        throw error;
      })
    );
  }

  /**
   * Actualizar un comentario
   * @param id - ID del comentario
   * @param datos - Nuevos datos del comentario (texto)
   * @returns Observable con la respuesta del servidor
   */
  actualizar(id: number, datos: ComentarioUpdateRequest): Observable<ComentarioResponse> {
    console.log('✏️ Actualizando comentario ID:', id);

    return this.http.put<ComentarioResponse>(
      `${this.apiUrl}/${id}`, 
      datos,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => {
        console.log('✅ Comentario actualizado:', response);
        return response;
      }),
      catchError(error => {
        console.error('❌ Error al actualizar comentario:', error);
        throw error;
      })
    );
  }

  /**
   * Eliminar un comentario
   * @param id - ID del comentario
   * @returns Observable con la respuesta del servidor
   */
  eliminar(id: number): Observable<ComentarioResponse> {
    console.log('🗑️ Eliminando comentario ID:', id);

    return this.http.delete<ComentarioResponse>(
      `${this.apiUrl}/${id}`,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => {
        console.log('✅ Comentario eliminado:', response);
        return response;
      }),
      catchError(error => {
        console.error('❌ Error al eliminar comentario:', error);
        throw error;
      })
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
  ): Observable<Comentario[]> {
    console.log('📜 Cargando más comentarios...');

    const offset = comentariosActuales.length;
    return this.obtenerPorPublicacion(publicacionId, limit, offset);
  }
}