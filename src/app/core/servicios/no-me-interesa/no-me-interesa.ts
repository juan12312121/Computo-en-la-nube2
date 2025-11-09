import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, of, tap } from 'rxjs';

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
  fecha_marcado: string;
  categoria_guardada?: string;
}

export interface CategoriaNoInteresa {
  categoria: string;
  total: number;
  porcentaje: number;
}

export interface EstadisticasNoInteresa {
  total_publicaciones: number;
  total_categorias: number;
  dias_activos: number;
  primera_marca: string | null;
  ultima_marca: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  mensaje?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NoMeInteresaService {
  private apiUrl: string;

  constructor(private http: HttpClient) {
    const host = window.location.hostname;
    this.apiUrl = host === 'localhost' || host === '127.0.0.1'
      ? 'http://localhost:3000/api/reportes'
      : 'http://3.146.83.30:3000/api/reportes';
    
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
  // MARCAR "NO ME INTERESA"
  // ============================================
  /**
   * Marcar una publicación como "No me interesa"
   * 📌 El algoritmo aprende de tus preferencias
   * 📌 Si marcas 3+ publicaciones de una categoría, verás menos de esa categoría
   * 📌 La publicación individual NO aparecerá más en tu feed
   * 
   * @param publicacionId - ID de la publicación a marcar
   * @returns Observable con respuesta del servidor
   */
  marcarNoInteresa(publicacionId: number): Observable<ApiResponse<{ id: number; publicacionId: number; totalMarcadas: number }>> {
    console.log('👎 Marcando publicación como "No me interesa":', publicacionId);
    
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/no-interesa`,
      { publicacionId },
      this.getHeaders()
    ).pipe(
      tap(response => {
        if (response.success) {
          console.log('✅ Publicación marcada como "No me interesa":', {
            publicacionId: response.data.publicacionId,
            totalMarcadas: response.data.totalMarcadas
          });
        }
      }),
      catchError(error => {
        console.error('❌ Error al marcar "No me interesa":', error);
        return of({
          success: false,
          data: null as any,
          message: 'Error al marcar "No me interesa"'
        });
      })
    );
  }

  // ============================================
  // DESMARCAR "NO ME INTERESA"
  // ============================================
  /**
   * Desmarcar una publicación como "No me interesa"
   * La publicación volverá a aparecer en tu feed
   * 
   * @param publicacionId - ID de la publicación a desmarcar
   * @returns Observable con respuesta del servidor
   */
  desmarcarNoInteresa(publicacionId: number): Observable<ApiResponse<{ publicacionId: number }>> {
    console.log('👍 Desmarcando "No me interesa":', publicacionId);
    
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/si-interesa`,
      { publicacionId },
      this.getHeaders()
    ).pipe(
      tap(response => {
        if (response.success) {
          console.log('✅ Publicación desmarcada:', publicacionId);
        }
      }),
      catchError(error => {
        console.error('❌ Error al desmarcar "No me interesa":', error);
        return of({
          success: false,
          data: null as any,
          message: 'Error al desmarcar "No me interesa"'
        });
      })
    );
  }

  // ============================================
  // OBTENER PUBLICACIONES MARCADAS
  // ============================================
  /**
   * Obtener todas las publicaciones marcadas como "No me interesa"
   * @returns Observable con array de publicaciones
   */
  obtenerPublicacionesNoInteresan(): Observable<ApiResponse<PublicacionNoInteresa[]>> {
    console.log('🔍 Obteniendo publicaciones marcadas como "No me interesa"...');
    
    return this.http.get<ApiResponse<PublicacionNoInteresa[]>>(
      `${this.apiUrl}/no-interesan`,
      this.getHeaders()
    ).pipe(
      tap(response => {
        console.log('✅ Publicaciones "No me interesa" obtenidas:', response.data?.length || 0);
      }),
      catchError(error => {
        console.error('❌ Error al obtener publicaciones:', error);
        return of({
          success: false,
          data: [],
          message: 'Error al obtener publicaciones'
        });
      })
    );
  }

  // ============================================
  // OBTENER CATEGORÍAS QUE NO INTERESAN
  // ============================================
  /**
   * Obtener categorías que has marcado frecuentemente como "No me interesa"
   * Solo muestra categorías con 3 o más marcas
   * 
   * @returns Observable con array de categorías
   */
  obtenerCategoriasNoInteresan(): Observable<ApiResponse<CategoriaNoInteresa[]>> {
    console.log('📊 Obteniendo categorías que no te interesan...');
    
    return this.http.get<ApiResponse<CategoriaNoInteresa[]>>(
      `${this.apiUrl}/categorias-no-interesan`,
      this.getHeaders()
    ).pipe(
      tap(response => {
        console.log('✅ Categorías que no interesan:', {
          total: response.data?.length || 0,
          categorias: response.data?.map(c => c.categoria)
        });
      }),
      catchError(error => {
        console.error('❌ Error al obtener categorías:', error);
        return of({
          success: false,
          data: [],
          message: 'Error al obtener categorías'
        });
      })
    );
  }

  // ============================================
  // OBTENER ESTADÍSTICAS
  // ============================================
  /**
   * Obtener estadísticas generales de "No me interesa"
   * Muestra total de publicaciones marcadas, categorías, etc.
   * 
   * @returns Observable con estadísticas
   */
  obtenerEstadisticas(): Observable<ApiResponse<EstadisticasNoInteresa>> {
    console.log('📈 Obteniendo estadísticas de "No me interesa"...');
    
    return this.http.get<ApiResponse<EstadisticasNoInteresa>>(
      `${this.apiUrl}/estadisticas-no-interesa`,
      this.getHeaders()
    ).pipe(
      tap(response => {
        console.log('✅ Estadísticas obtenidas:', response.data);
      }),
      catchError(error => {
        console.error('❌ Error al obtener estadísticas:', error);
        return of({
          success: false,
          data: {
            total_publicaciones: 0,
            total_categorias: 0,
            dias_activos: 0,
            primera_marca: null,
            ultima_marca: null
          },
          message: 'Error al obtener estadísticas'
        });
      })
    );
  }

  // ============================================
  // LIMPIAR MARCAS
  // ============================================
  /**
   * Eliminar TODAS las marcas de "No me interesa"
   * ⚠️ Esto resetea tus preferencias completamente
   * 
   * @returns Observable con cantidad de marcas eliminadas
   */
  limpiarTodasLasMarcas(): Observable<ApiResponse<{ cantidad: number }>> {
    console.log('🗑️ Limpiando todas las marcas "No me interesa"...');
    
    return this.http.delete<ApiResponse<{ cantidad: number }>>(
      `${this.apiUrl}/limpiar-no-interesa`,
      this.getHeaders()
    ).pipe(
      tap(response => {
        if (response.success) {
          console.log('✅ Marcas eliminadas:', response.data.cantidad);
        }
      }),
      catchError(error => {
        console.error('❌ Error al limpiar marcas:', error);
        return of({
          success: false,
          data: { cantidad: 0 },
          message: 'Error al limpiar marcas'
        });
      })
    );
  }

  /**
   * Eliminar marcas de "No me interesa" de una categoría específica
   * Útil si cambias de opinión sobre una categoría
   * 
   * @param categoria - Nombre de la categoría
   * @returns Observable con cantidad de marcas eliminadas
   */
  limpiarPorCategoria(categoria: string): Observable<ApiResponse<{ categoria: string; cantidad: number }>> {
    console.log('🗑️ Limpiando marcas de categoría:', categoria);
    
    return this.http.delete<ApiResponse<{ categoria: string; cantidad: number }>>(
      `${this.apiUrl}/limpiar-categoria`,
      {
        ...this.getHeaders(),
        body: { categoria }
      }
    ).pipe(
      tap(response => {
        if (response.success) {
          console.log('✅ Marcas de categoría eliminadas:', {
            categoria: response.data.categoria,
            cantidad: response.data.cantidad
          });
        }
      }),
      catchError(error => {
        console.error('❌ Error al limpiar categoría:', error);
        return of({
          success: false,
          data: { categoria, cantidad: 0 },
          message: 'Error al limpiar categoría'
        });
      })
    );
  }

  // ============================================
  // UTILIDADES
  // ============================================
  /**
   * Verificar si una publicación está marcada como "No me interesa"
   * (Verificación local - requiere tener la lista cargada)
   * 
   * @param publicacionesNoInteresan - Array de IDs de publicaciones marcadas
   * @param publicacionId - ID de la publicación a verificar
   * @returns true si está marcada
   */
  estaNoInteresa(publicacionesNoInteresan: number[], publicacionId: number): boolean {
    return publicacionesNoInteresan.includes(publicacionId);
  }

  /**
   * Verificar si una categoría está en la lista de "No me interesa"
   * 
   * @param categoriasNoInteresan - Array de categorías marcadas
   * @param categoria - Categoría a verificar
   * @returns true si está marcada
   */
  categoriaNoInteresa(categoriasNoInteresan: CategoriaNoInteresa[], categoria: string): boolean {
    return categoriasNoInteresan.some(c => c.categoria === categoria);
  }

  /**
   * Obtener porcentaje de rechazo de una categoría
   * 
   * @param categoriasNoInteresan - Array de categorías marcadas
   * @param categoria - Categoría a buscar
   * @returns Porcentaje de rechazo (0-100) o 0 si no existe
   */
  obtenerPorcentajeRechazo(categoriasNoInteresan: CategoriaNoInteresa[], categoria: string): number {
    const cat = categoriasNoInteresan.find(c => c.categoria === categoria);
    return cat ? Math.round(cat.porcentaje) : 0;
  }
}