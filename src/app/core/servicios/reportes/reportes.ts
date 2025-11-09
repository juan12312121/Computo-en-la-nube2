import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, of, tap } from 'rxjs';

export interface CrearReporteRequest {
  publicacionId: number;
  motivo: string;
  descripcion?: string;
}

export interface CrearReporteResponse {
  reporteId: number;
  totalReportes: number;
}

export interface Reporte {
  id: number;
  publicacion_id: number;
  usuario_id: number;
  motivo: string;
  descripcion?: string;
  fecha_reporte: string;
  nombre_completo?: string;
  nombre_usuario?: string;
}

export interface EstadisticasReportes {
  id: number;
  nombre_completo: string;
  nombre_usuario: string;
  suspendido: number;
  publicaciones_eliminadas: number;
  total_publicaciones_reportadas: number;
  total_reportes_recibidos: number;
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
export class ReportesService {
  private apiUrl: string;

  constructor(private http: HttpClient) {
    const host = window.location.hostname;
    this.apiUrl = host === 'localhost' || host === '127.0.0.1'
      ? 'http://localhost:3000/api/reportes'
      : 'http://3.146.83.30:3000/api/reportes';
    
    console.log('🔧 ReportesService inicializado');
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
  // CREAR REPORTE
  // ============================================
  /**
   * Crear un reporte de una publicación
   * ✅ Un usuario solo puede reportar UNA VEZ por publicación
   * ✅ Pero múltiples usuarios pueden reportar la MISMA publicación
   * ✅ Al 5to reporte, la publicación se elimina automáticamente
   * 
   * @param reporte - { publicacionId, motivo, descripcion? }
   * @returns Observable con { reporteId, totalReportes }
   */
  crearReporte(reporte: CrearReporteRequest): Observable<ApiResponse<CrearReporteResponse>> {
    console.log('📝 Creando reporte para publicación:', reporte.publicacionId);
    console.log('   Motivo:', reporte.motivo);
    
    return this.http.post<ApiResponse<CrearReporteResponse>>(
      `${this.apiUrl}/crear`,
      reporte,
      this.getHeaders()
    ).pipe(
      tap(response => {
        if (response.success) {
          console.log('✅ Reporte creado:', {
            reporteId: response.data.reporteId,
            totalReportes: response.data.totalReportes
          });
          
          // Si hay 5+ reportes, mostrar alerta
          if (response.data.totalReportes >= 5) {
            console.warn('🚨 Publicación eliminada por exceso de reportes');
          }
        }
      }),
      catchError(error => {
        console.error('❌ Error al crear reporte:', error.error?.mensaje || error.message);
        
        return of({
          success: false,
          data: null as any,
          message: error.error?.mensaje || 'Error al crear reporte',
          mensaje: error.error?.mensaje || 'Error al crear reporte'
        });
      })
    );
  }

  // ============================================
  // OBTENER REPORTES DE UNA PUBLICACIÓN
  // ============================================
  /**
   * Obtener todos los reportes de una publicación específica
   * @param publicacionId - ID de la publicación
   * @returns Observable con array de reportes
   */
  obtenerReportesPorPublicacion(publicacionId: number): Observable<ApiResponse<Reporte[]>> {
    console.log('📊 Obteniendo reportes de publicación:', publicacionId);
    
    return this.http.get<ApiResponse<Reporte[]>>(
      `${this.apiUrl}/publicacion/${publicacionId}`,
      this.getHeaders()
    ).pipe(
      tap(response => {
        console.log('✅ Reportes obtenidos:', {
          cantidad: response.data?.length || 0,
          publicacionId
        });
      }),
      catchError(error => {
        console.error('❌ Error al obtener reportes:', error);
        return of({
          success: false,
          data: [],
          message: 'Error al obtener reportes'
        });
      })
    );
  }

  // ============================================
  // OBTENER TODOS LOS REPORTES DEL SISTEMA
  // ============================================
  /**
   * Obtener todas las publicaciones reportadas (para moderadores/admin)
   * @returns Observable con array de publicaciones reportadas
   */
  obtenerTodosReportes(): Observable<ApiResponse<any[]>> {
    console.log('📈 Obteniendo todos los reportes del sistema...');
    
    return this.http.get<ApiResponse<any[]>>(
      `${this.apiUrl}/todos`,
      this.getHeaders()
    ).pipe(
      tap(response => {
        console.log('✅ Reportes del sistema:', response.data?.length || 0);
      }),
      catchError(error => {
        console.error('❌ Error al obtener reportes:', error);
        return of({
          success: false,
          data: [],
          message: 'Error al obtener reportes'
        });
      })
    );
  }

  // ============================================
  // OBTENER ESTADÍSTICAS DE USUARIOS REPORTADOS
  // ============================================
  /**
   * Obtener estadísticas de usuarios con publicaciones reportadas/eliminadas
   * Muestra usuarios suspendidos y el motivo
   * @returns Observable con array de estadísticas
   */
  obtenerEstadisticasReportes(): Observable<ApiResponse<EstadisticasReportes[]>> {
    console.log('👥 Obteniendo estadísticas de usuarios reportados...');
    
    return this.http.get<ApiResponse<EstadisticasReportes[]>>(
      `${this.apiUrl}/estadisticas`,
      this.getHeaders()
    ).pipe(
      tap(response => {
        console.log('✅ Estadísticas obtenidas:', {
          usuarios: response.data?.length || 0,
          suspendidos: response.data?.filter(u => u.suspendido === 1).length || 0
        });
      }),
      catchError(error => {
        console.error('❌ Error al obtener estadísticas:', error);
        return of({
          success: false,
          data: [],
          message: 'Error al obtener estadísticas'
        });
      })
    );
  }

  // ============================================
  // VALIDAR MOTIVOS
  // ============================================
  /**
   * Obtener lista de motivos válidos para reportes
   * @returns Array con motivos válidos
   */
  obtenerMotivosValidos(): string[] {
    return [
      'Acoso o bullying',
      'Violencia o daño',
      'Spam o publicidad',
      'Información falsa',
      'Suplantación de identidad',
      'Lenguaje ofensivo',
      'Otro'
    ];
  }

  /**
   * Validar si un motivo es válido
   * @param motivo - Motivo a validar
   * @returns true si es válido
   */
  esMotivosValido(motivo: string): boolean {
    return this.obtenerMotivosValidos().includes(motivo);
  }
}

