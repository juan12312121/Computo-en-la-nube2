import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, of, tap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../modelos/api-response.model';

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

// Interfaces movidas a modelos/

@Injectable({
  providedIn: 'root'
})
export class ReportesService {
  private apiUrl = environment.apiUrl + '/reportes';

  constructor(private http: HttpClient) {
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
    console.log('   Descripción:', reporte.descripcion || '(sin descripción)');

    // Validar datos antes de enviar
    if (!reporte.publicacionId || !reporte.motivo) {
      console.error('❌ Datos inválidos:', reporte);
      return throwError(() => new Error('Publicación y motivo son obligatorios'));
    }

    // Validar que el motivo sea válido
    if (!this.esMotivosValido(reporte.motivo)) {
      console.error('❌ Motivo inválido:', reporte.motivo);
      return throwError(() => new Error('Motivo inválido'));
    }

    // Limpiar descripción vacía (MySQL necesita null, NO undefined)
    const payload: CrearReporteRequest = {
      publicacionId: reporte.publicacionId,
      motivo: reporte.motivo,
      descripcion: reporte.descripcion?.trim() || null as any
    };

    return this.http.post<ApiResponse<CrearReporteResponse>>(
      `${this.apiUrl}/crear`,
      payload,
      this.getHeaders()
    ).pipe(
      tap(response => {
        if (response.success) {
          console.log('✅ Reporte creado exitosamente:', {
            reporteId: response.data.reporteId,
            totalReportes: response.data.totalReportes
          });

          if (response.data.totalReportes >= 5) {
            console.warn('🚨 Publicación eliminada por exceso de reportes');
          }
        }
      }),
      catchError(error => {
        const errorMsg = error.error?.mensaje || error.error?.message || 'Error al crear reporte';
        console.error('❌ Error al crear reporte:', errorMsg);

        // Retornar error específico para que el componente lo maneje
        return throwError(() => ({
          success: false,
          data: null as any,
          message: errorMsg,
          mensaje: errorMsg,
          error: error
        }));
      })
    );
  }

  // ============================================
  // OBTENER REPORTES DE UNA PUBLICACIÓN
  // ============================================
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
   * IMPORTANTE: Estos deben coincidir EXACTAMENTE con el backend
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
   */
  esMotivosValido(motivo: string): boolean {
    return this.obtenerMotivosValidos().includes(motivo);
  }
}
