import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, of, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../modelos/api-response.model';
export interface PublicacionOculta {
  id: number;
  contenido: string;
  categoria: string;
  tipo_publicacion?: string;
  fecha_creacion: string;
  usuario_id: number;
  nombre_completo: string;
  nombre_usuario: string;
  foto_perfil?: string;
  fecha_ocultado: string;
  es_propia: boolean;
}

// Interfaces movidas a modelos/

@Injectable({
  providedIn: 'root'
})
export class PublicacionesOcultasService {
  private apiUrl = environment.apiUrl + '/reportes';

  constructor(private http: HttpClient) {
    console.log('🔧 PublicacionesOcultasService inicializado');
    console.log('📍 API URL:', this.apiUrl);
  }

  private getHeaders(): { headers?: HttpHeaders } {
    const token = localStorage.getItem('token');

    if (token) {
      return {
        headers: new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        })
      };
    }

    return {};
  }

  // ============================================
  // OCULTAR PUBLICACIÓN INDIVIDUAL
  // ============================================
  /**
   * Ocultar una publicación del feed del usuario actual
   * ℹ️ La publicación no se elimina, solo NO aparece en el feed del usuario
   * ℹ️ Si es propia: NADIE la puede ver (excepto en sección "propias ocultas")
   * ℹ️ Si es de otro: Solo TÚ dejas de verla, otros sí la ven
   *
   * @param publicacionId - ID de la publicación a ocultar
   * @returns Observable con respuesta del servidor
   */
  ocultarPublicacion(publicacionId: number): Observable<ApiResponse<any>> {
    console.log('🚫 Ocultando publicación:', publicacionId);

    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/ocultar`,
      { publicacionId },
      this.getHeaders()
    ).pipe(
      tap(response => {
        if (response.success) {
          console.log('✅ Publicación ocultada:', publicacionId);
        }
      }),
      catchError(error => {
        console.error('❌ Error al ocultar publicación:', error);
        return of({
          success: false,
          data: null,
          message: 'Error al ocultar publicación'
        });
      })
    );
  }

  // ============================================
  // MOSTRAR PUBLICACIÓN OCULTA
  // ============================================
  /**
   * Mostrar una publicación que estaba oculta
   * Hace que vuelva a aparecer en el feed
   *
   * @param publicacionId - ID de la publicación a mostrar
   * @returns Observable con respuesta del servidor
   */
  mostrarPublicacion(publicacionId: number): Observable<ApiResponse<any>> {
    console.log('👁️ Mostrando publicación:', publicacionId);

    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/mostrar`,
      { publicacionId },
      this.getHeaders()
    ).pipe(
      tap(response => {
        if (response.success) {
          console.log('✅ Publicación mostrada:', publicacionId);
        }
      }),
      catchError(error => {
        console.error('❌ Error al mostrar publicación:', error);
        return of({
          success: false,
          data: null,
          message: 'Error al mostrar publicación'
        });
      })
    );
  }

  // ============================================
  // OBTENER PUBLICACIONES OCULTAS
  // ============================================
  /**
   * Obtener lista de TODAS las publicaciones ocultas del usuario
   * Incluye publicaciones propias y de otros usuarios
   * @returns Observable con array de publicaciones ocultas
   */
  obtenerPublicacionesOcultas(): Observable<ApiResponse<PublicacionOculta[]>> {
    console.log('🔍 Obteniendo publicaciones ocultas del usuario...');

    return this.http.get<ApiResponse<PublicacionOculta[]>>(
      `${this.apiUrl}/ocultas`,
      this.getHeaders()
    ).pipe(
      tap(response => {
        console.log('✅ Publicaciones ocultas obtenidas:', {
          total: response.data?.length || 0,
          propias: response.data?.filter(p => p.es_propia).length || 0,
          ajenas: response.data?.filter(p => !p.es_propia).length || 0
        });
      }),
      catchError(error => {
        console.error('❌ Error al obtener publicaciones ocultas:', error);
        return of({
          success: false,
          data: [],
          message: 'Error al obtener publicaciones ocultas'
        });
      })
    );
  }

  // ============================================
  // PUBLICACIONES PROPIAS OCULTAS
  // ============================================
  /**
   * Ocultar TODAS las publicaciones propias
   * ⚠️ NADIE podrá ver tus publicaciones (ni tú en el feed)
   * ✅ Solo visibles en la sección "Mis publicaciones ocultas"
   *
   * @returns Observable con cantidad de publicaciones ocultadas
   */
  ocultarTodasPropias(): Observable<ApiResponse<{ cantidad: number }>> {
    console.log('🔒 Ocultando TODAS las publicaciones propias...');

    return this.http.post<ApiResponse<{ cantidad: number }>>(
      `${this.apiUrl}/ocultar-propias`,
      {},
      this.getHeaders()
    ).pipe(
      tap(response => {
        if (response.success) {
          console.log('✅ Publicaciones propias ocultadas:', response.data.cantidad);
        }
      }),
      catchError(error => {
        console.error('❌ Error al ocultar publicaciones propias:', error);
        return of({
          success: false,
          data: { cantidad: 0 },
          message: 'Error al ocultar publicaciones propias'
        });
      })
    );
  }

  /**
   * Mostrar TODAS las publicaciones propias ocultas
   * Hace que vuelvan a ser visibles para todos
   *
   * @returns Observable con cantidad de publicaciones mostradas
   */
  mostrarTodasPropias(): Observable<ApiResponse<{ cantidad: number }>> {
    console.log('🔓 Mostrando TODAS las publicaciones propias...');

    return this.http.post<ApiResponse<{ cantidad: number }>>(
      `${this.apiUrl}/mostrar-propias`,
      {},
      this.getHeaders()
    ).pipe(
      tap(response => {
        if (response.success) {
          console.log('✅ Publicaciones propias mostradas:', response.data.cantidad);
        }
      }),
      catchError(error => {
        console.error('❌ Error al mostrar publicaciones propias:', error);
        return of({
          success: false,
          data: { cantidad: 0 },
          message: 'Error al mostrar publicaciones propias'
        });
      })
    );
  }

  /**
   * Obtener solo las publicaciones PROPIAS que están ocultas
   * No incluye publicaciones de otros usuarios
   *
   * @returns Observable con array de publicaciones propias ocultas
   */
  obtenerPropiasOcultas(): Observable<ApiResponse<any[]>> {
    console.log('🔍 Obteniendo publicaciones propias ocultas...');

    return this.http.get<ApiResponse<any[]>>(
      `${this.apiUrl}/propias-ocultas`,
      this.getHeaders()
    ).pipe(
      tap(response => {
        console.log('✅ Publicaciones propias ocultas obtenidas:', response.data?.length || 0);
      }),
      catchError(error => {
        console.error('❌ Error al obtener publicaciones propias ocultas:', error);
        return of({
          success: false,
          data: [],
          message: 'Error al obtener publicaciones propias ocultas'
        });
      })
    );
  }

  // ============================================
  // UTILIDADES
  // ============================================
  /**
   * Verificar si una publicación está oculta para el usuario
   * (Nota: Esta es una verificación LOCAL, no requiere servidor)
   *
   * @param publicacionesOcultas - Array de IDs de publicaciones ocultas
   * @param publicacionId - ID de la publicación a verificar
   * @returns true si está oculta
   */
  estaOculta(publicacionesOcultas: number[], publicacionId: number): boolean {
    return publicacionesOcultas.includes(publicacionId);
  }

  /**
   * Filtrar publicaciones propias del array
   *
   * @param publicaciones - Array de publicaciones ocultas
   * @returns Array solo con publicaciones propias
   */
  filtrarPropias(publicaciones: PublicacionOculta[]): PublicacionOculta[] {
    return publicaciones.filter(p => p.es_propia);
  }

  /**
   * Filtrar publicaciones de otros del array
   *
   * @param publicaciones - Array de publicaciones ocultas
   * @returns Array solo con publicaciones ajenas
   */
  filtrarAjenas(publicaciones: PublicacionOculta[]): PublicacionOculta[] {
    return publicaciones.filter(p => !p.es_propia);
  }
}
