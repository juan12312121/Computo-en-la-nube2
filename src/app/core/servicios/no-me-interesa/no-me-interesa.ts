import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, of, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../modelos/api-response.model';

// ============================================
// INTERFACES
// ============================================

export interface PublicacionNoInteresa {
  id: number;
  contenido: string;
  categoria: string;
  tipo_publicacion?: string;
  fecha_publicacion: string;
  autor_id: number;
  nombre_completo: string;
  nombre_usuario: string;
  foto_perfil?: string;
  fecha_ocultada: string;
}

// Interfaces movidas a modelos/

@Injectable({
  providedIn: 'root'
})
export class NoMeInteresaService {
  private apiUrl = environment.apiUrl + '/reportes';

  constructor(private http: HttpClient) {
    console.log('🔧 NoMeInteresaService inicializado');
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
  // MARCAR "NO ME INTERESA" (OCULTAR)
  // ============================================
  /**
   * Marcar una publicación como "No me interesa"
   * 📌 La publicación se ocultará SOLO para ti
   * 📌 No afecta a otros usuarios
   * 📌 Puedes desmarcarlo más tarde para volver a verla
   *
   * @param publicacionId - ID de la publicación a ocultar
   * @returns Observable con respuesta del servidor
   */
  marcarNoInteresa(publicacionId: number): Observable<ApiResponse<{ id: number; publicacionId: number }>> {
    console.log('👎 Ocultando publicación:', publicacionId);

    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/no-interesa`,
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
          data: null as any,
          message: 'Error al ocultar publicación'
        });
      })
    );
  }

  // ============================================
  // DESMARCAR "NO ME INTERESA" (MOSTRAR)
  // ============================================
  /**
   * Desmarcar una publicación como "No me interesa"
   * La publicación volverá a aparecer en tu feed
   *
   * @param publicacionId - ID de la publicación a mostrar
   * @returns Observable con respuesta del servidor
   */
  desmarcarNoInteresa(publicacionId: number): Observable<ApiResponse<{ publicacionId: number }>> {
    console.log('👍 Mostrando publicación nuevamente:', publicacionId);

    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/si-interesa`,
      { publicacionId },
      this.getHeaders()
    ).pipe(
      tap(response => {
        if (response.success) {
          console.log('✅ Publicación visible nuevamente:', publicacionId);
        }
      }),
      catchError(error => {
        console.error('❌ Error al mostrar publicación:', error);
        return of({
          success: false,
          data: null as any,
          message: 'Error al mostrar publicación'
        });
      })
    );
  }

  // ============================================
  // OBTENER PUBLICACIONES OCULTAS
  // ============================================
  /**
   * Obtener todas las publicaciones que has ocultado
   * @returns Observable con array de publicaciones ocultas
   */
  obtenerPublicacionesNoInteresan(): Observable<ApiResponse<PublicacionNoInteresa[]>> {
    console.log('🔍 Obteniendo publicaciones ocultas...');

    return this.http.get<ApiResponse<PublicacionNoInteresa[]>>(
      `${this.apiUrl}/no-interesan`,
      this.getHeaders()
    ).pipe(
      tap(response => {
        console.log('✅ Publicaciones ocultas obtenidas:', response.data?.length || 0);
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
  // LIMPIAR TODAS LAS MARCAS
  // ============================================
  /**
   * Mostrar TODAS las publicaciones ocultas nuevamente
   * ⚠️ Esto hará visibles todas las publicaciones que habías ocultado
   *
   * @returns Observable con cantidad de publicaciones mostradas
   */
  limpiarTodasLasMarcas(): Observable<ApiResponse<{ cantidad: number }>> {
    console.log('🗑️ Mostrando todas las publicaciones ocultas...');

    return this.http.delete<ApiResponse<{ cantidad: number }>>(
      `${this.apiUrl}/limpiar-no-interesa`,
      this.getHeaders()
    ).pipe(
      tap(response => {
        if (response.success) {
          console.log('✅ Publicaciones visibles nuevamente:', response.data.cantidad);
        }
      }),
      catchError(error => {
        console.error('❌ Error al limpiar publicaciones ocultas:', error);
        return of({
          success: false,
          data: { cantidad: 0 },
          message: 'Error al limpiar publicaciones ocultas'
        });
      })
    );
  }

  // ============================================
  // UTILIDADES
  // ============================================
  /**
   * Verificar si una publicación está oculta
   * (Verificación local - requiere tener la lista cargada)
   *
   * @param publicacionesOcultas - Array de IDs de publicaciones ocultas
   * @param publicacionId - ID de la publicación a verificar
   * @returns true si está oculta
   */
  estaNoInteresa(publicacionesOcultas: number[], publicacionId: number): boolean {
    return publicacionesOcultas.includes(publicacionId);
  }
}
