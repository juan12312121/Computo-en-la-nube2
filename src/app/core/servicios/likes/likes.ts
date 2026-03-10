import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../modelos/api-response.model';
import { AutenticacionService } from '../autenticacion/autenticacion';

// Interfaces
// Interfaces movidas a modelos/
export interface LikeResponse extends ApiResponse<any> { }
export interface LikesPublicacionResponse extends ApiResponse<any> { }

@Injectable({
  providedIn: 'root'
})
export class LikesService {
  // ✅ Usando API centralizada para soporte móvil
  private readonly apiUrl = environment.apiUrl + '/likes';

  constructor(
    private http: HttpClient,
    private autenticacionService: AutenticacionService
  ) {
    console.log('❤️ LikesService inicializado');
    console.log('📍 API URL (LOCAL):', this.apiUrl);
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
    console.log('🔍 [LIKES] Verificando like para publicación:', publicacionId);

    return this.http.get<LikeResponse>(
      `${this.apiUrl}/verificar/${publicacionId}`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        console.log('✅ [LIKES] Like verificado:', {
          publicacionId,
          usuario_dio_like: response.data?.usuario_dio_like,
          total_likes: response.data?.total_likes
        });
      })
    );
  }

  /**
   * Agregar o eliminar like automáticamente (TOGGLE)
   * Este es el método principal recomendado
   */
  toggleLike(publicacionId: number): Observable<LikeResponse> {
    console.log('🔄 [LIKES] Toggle like para publicación:', publicacionId);

    return this.http.post<LikeResponse>(
      `${this.apiUrl}/toggle`,
      { publicacion_id: publicacionId },
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        console.log('✅ [LIKES] Toggle completado:', {
          success: response.success,
          publicacionId,
          usuario_dio_like: response.data?.usuario_dio_like,
          total_likes: response.data?.total_likes
        });

        if (response.data) {
          const accion = response.data.usuario_dio_like ? 'dado' : 'quitado';
          console.log(`❤️ [LIKES] Like ${accion}. Nuevo total:`, response.data.total_likes);
        }
      })
    );
  }

  /**
   * Obtener todos los likes de una publicación con totales
   */
  obtenerPorPublicacion(publicacionId: number): Observable<LikesPublicacionResponse> {
    console.log('📊 [LIKES] Obteniendo likes de publicación:', publicacionId);

    return this.http.get<LikesPublicacionResponse>(
      `${this.apiUrl}/publicacion/${publicacionId}`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        console.log('✅ [LIKES] Likes obtenidos:', {
          publicacionId,
          total: response.data?.total,
          usuario_dio_like: response.data?.usuario_dio_like,
          cantidad_detalles: response.data?.likes?.length || 0
        });
      })
    );
  }

  /**
   * Dar like a una publicación
   * @deprecated Usar toggleLike() en su lugar para mejor UX
   */
  darLike(publicacionId: number): Observable<LikeResponse> {
    console.log('➕ [LIKES] Dando like a publicación:', publicacionId);
    console.warn('⚠️ [LIKES] Método deprecated, considera usar toggleLike()');

    return this.http.post<LikeResponse>(
      `${this.apiUrl}/crear`,
      { publicacion_id: publicacionId },
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        console.log('✅ [LIKES] Like dado:', {
          success: response.success,
          likeId: response.data?.id
        });
      })
    );
  }

  /**
   * Quitar like de una publicación
   * @deprecated Usar toggleLike() en su lugar para mejor UX
   */
  quitarLike(likeId: number): Observable<LikeResponse> {
    console.log('➖ [LIKES] Quitando like ID:', likeId);
    console.warn('⚠️ [LIKES] Método deprecated, considera usar toggleLike()');

    return this.http.delete<LikeResponse>(
      `${this.apiUrl}/${likeId}`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        console.log('✅ [LIKES] Like quitado:', {
          success: response.success
        });
      })
    );
  }

  /**
   * Obtener likes que ha dado un usuario
   */
  obtenerLikesUsuario(usuarioId: number): Observable<any> {
    console.log('👤 [LIKES] Obteniendo likes del usuario:', usuarioId);

    return this.http.get(
      `${this.apiUrl}/usuario/${usuarioId}`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        console.log('✅ [LIKES] Likes del usuario obtenidos:', {
          usuarioId,
          response
        });
      })
    );
  }

  /**
   * ✅ NUEVA: Obtener estadísticas de likes de múltiples publicaciones
   * Útil para cargar likes en batch
   */
  obtenerLikesMultiplesPublicaciones(publicacionIds: number[]): Observable<any> {
    console.log('📊 [LIKES] Obteniendo likes de múltiples publicaciones:', publicacionIds.length);

    return this.http.post(
      `${this.apiUrl}/batch`,
      { publicacion_ids: publicacionIds },
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        console.log('✅ [LIKES] Likes batch obtenidos:', response);
      })
    );
  }

  /**
   * ✅ NUEVA: Obtener URL base de la API
   */
  getApiUrl(): string {
    return this.apiUrl;
  }
}
