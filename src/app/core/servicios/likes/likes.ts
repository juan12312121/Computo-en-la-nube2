import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { AutenticacionService } from '../autenticacion/autenticacion';

// Interfaces
export interface LikeResponse {
  success: boolean;
  message?: string;
  data?: {
    id?: number;
    usuario_id?: number;
    publicacion_id?: number;
    total_likes?: number;
    usuario_dio_like?: boolean;
    fecha_creacion?: string;
  };
}

export interface LikesPublicacionResponse {
  success: boolean;
  data?: {
    total: number;
    usuario_dio_like: boolean;
    likes?: any[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class LikesService {
  private apiUrl = window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api/likes'
    : 'http://3.146.83.30:3000/api/likes';

  constructor(
    private http: HttpClient,
    private autenticacionService: AutenticacionService
  ) {
    console.log('🔧 LikesService inicializado');
    console.log('📍 API URL:', this.apiUrl);
  }

  /**
   * Obtener headers con token de autenticación
   */
  private getHeaders(): HttpHeaders {
    const token = this.autenticacionService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Verificar si el usuario actual ha dado like a una publicación
   */
  verificarLike(publicacionId: number): Observable<LikeResponse> {
    console.log('🔍 Verificando like para publicación:', publicacionId);
    
    return this.http.get<LikeResponse>(
      `${this.apiUrl}/verificar/${publicacionId}`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => console.log('✅ Like verificado:', response))
    );
  }

  /**
   * Agregar o eliminar like automáticamente (TOGGLE)
   */
  toggleLike(publicacionId: number): Observable<LikeResponse> {
    console.log('🔄 Toggle like para publicación:', publicacionId);
    
    return this.http.post<LikeResponse>(
      `${this.apiUrl}/toggle`, 
      { publicacion_id: publicacionId },
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        console.log('✅ Toggle like response:', response);
        if (response.data) {
          console.log('📊 Nuevo total de likes:', response.data.total_likes);
          console.log('❤️ Usuario dio like:', response.data.usuario_dio_like);
        }
      })
    );
  }

  /**
   * Obtener todos los likes de una publicación con totales
   */
  obtenerPorPublicacion(publicacionId: number): Observable<LikesPublicacionResponse> {
    console.log('📊 Obteniendo likes de publicación:', publicacionId);
    
    return this.http.get<LikesPublicacionResponse>(
      `${this.apiUrl}/publicacion/${publicacionId}`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        console.log('✅ Likes obtenidos:', response);
        if (response.data) {
          console.log('📈 Total:', response.data.total);
          console.log('❤️ Usuario dio like:', response.data.usuario_dio_like);
        }
      })
    );
  }

  /**
   * Dar like a una publicación (DEPRECATED - Usar toggleLike)
   */
  darLike(publicacionId: number): Observable<LikeResponse> {
    console.log('➕ Dando like a publicación:', publicacionId);
    
    return this.http.post<LikeResponse>(
      `${this.apiUrl}/crear`, 
      { publicacion_id: publicacionId },
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => console.log('✅ Like dado:', response))
    );
  }

  /**
   * Quitar like de una publicación (DEPRECATED - Usar toggleLike)
   */
  quitarLike(likeId: number): Observable<LikeResponse> {
    console.log('➖ Quitando like ID:', likeId);
    
    return this.http.delete<LikeResponse>(
      `${this.apiUrl}/${likeId}`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => console.log('✅ Like quitado:', response))
    );
  }

  /**
   * Obtener likes que ha dado un usuario
   */
  obtenerLikesUsuario(usuarioId: number): Observable<any> {
    console.log('👤 Obteniendo likes del usuario:', usuarioId);
    
    return this.http.get(
      `${this.apiUrl}/usuario/${usuarioId}`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => console.log('✅ Likes del usuario obtenidos:', response))
    );
  }
}