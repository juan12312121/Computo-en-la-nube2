import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../modelos/api-response.model';
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
  // ✅ Metadata de censura (opcional, viene del backend)
  _censura?: {
    fue_censurado: boolean;
    nivel: string;
    palabras_censuradas: number;
  };
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

/**
 * ✅ NUEVA: Información sobre resultado de censura
 */
export interface ResultadoCensura {
  fue_censurado: boolean;
  nivel: string;
  palabras_censuradas: number;
  mensaje_usuario?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ComentariosService {
  // ✅ Usando API centralizada para soporte móvil
  private readonly apiUrl = environment.apiUrl + '/comentarios';

  constructor(
    private http: HttpClient,
    private autenticacionService: AutenticacionService
  ) {
    console.log('🔧 ComentariosService inicializado con soporte de censura');
    console.log('📍 API URL (LOCAL):', this.apiUrl);
  }

  /**
   * Obtiene los headers con el token de autenticación
   */
  private getHeaders(): HttpHeaders {
    const token = this.autenticacionService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * ✅ NUEVA: Generar mensaje amigable según nivel de censura
   */
  private generarMensajeCensura(censura: ResultadoCensura): string {
    if (!censura.fue_censurado) {
      return '✅ Comentario publicado exitosamente';
    }

    const palabras = censura.palabras_censuradas;

    switch (censura.nivel) {
      case 'bajo':
        return `💬 Tu comentario fue publicado. Se moderaron ${palabras} palabra${palabras > 1 ? 's' : ''} para mantener un ambiente respetuoso.`;

      case 'medio':
        return `⚠️ Tu comentario fue publicado con moderación. ${palabras} palabra${palabras > 1 ? 's' : ''} no permitida${palabras > 1 ? 's' : ''} fue${palabras > 1 ? 'ron' : ''} censurada${palabras > 1 ? 's' : ''}.`;

      case 'alto':
        return `🚨 Tu comentario fue publicado con moderación significativa. Por favor, recuerda mantener un lenguaje respetuoso en la plataforma.`;

      default:
        return `💬 Tu comentario fue publicado con moderación automática.`;
    }
  }

  /**
   * ✅ MEJORADO: Crear comentario con detección de censura
   */
  crear(datos: ComentarioRequest): Observable<ComentarioResponse & { censura?: ResultadoCensura }> {
    console.log('📝 Creando comentario para publicación:', datos.publicacion_id);

    return this.http.post<any>(
      this.apiUrl,
      datos,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => {
        console.log('✅ Respuesta del servidor:', response);

        // Extraer información de censura si existe
        const censura = response.data?._censura;

        if (censura && censura.fue_censurado) {
          console.log('🔒 Comentario censurado:', {
            nivel: censura.nivel,
            palabras: censura.palabras_censuradas
          });

          // Agregar mensaje amigable para el usuario
          const resultado: ResultadoCensura = {
            ...censura,
            mensaje_usuario: this.generarMensajeCensura(censura)
          };

          return {
            ...response,
            censura: resultado
          };
        }

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

        if (!response.success) {
          console.warn('⚠️ Respuesta no exitosa:', response.mensaje);
          return [];
        }

        const comentariosArray = response.data?.comentarios;

        if (!Array.isArray(comentariosArray)) {
          console.warn('⚠️ comentarios no es array:', comentariosArray);
          return [];
        }

        console.log('✅ Comentarios extraídos:', comentariosArray.length);
        return comentariosArray;
      }),
      catchError(error => {
        console.error('❌ Error obteniendo comentarios:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtener comentarios de un usuario específico
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
   * ✅ MEJORADO: Actualizar comentario con detección de censura
   */
  actualizar(id: number, datos: ComentarioUpdateRequest): Observable<ComentarioResponse & { censura?: ResultadoCensura }> {
    console.log('✏️ Actualizando comentario ID:', id);

    return this.http.put<any>(
      `${this.apiUrl}/${id}`,
      datos,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => {
        console.log('✅ Comentario actualizado:', response);

        // Extraer información de censura
        const censura = response.data?._censura;

        if (censura && censura.fue_censurado) {
          console.log('🔒 Actualización censurada:', {
            nivel: censura.nivel,
            palabras: censura.palabras_censuradas
          });

          const resultado: ResultadoCensura = {
            ...censura,
            mensaje_usuario: this.generarMensajeCensura(censura)
          };

          return {
            ...response,
            censura: resultado
          };
        }

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

  /**
   * ✅ NUEVA: Validar comentario antes de enviar (opcional)
   * Permite al usuario saber si su comentario podría ser censurado
   */
  validarTextoAntesDeComentar(texto: string): { valido: boolean; advertencia?: string } {
    // Validaciones básicas del lado del cliente
    if (!texto || texto.trim().length === 0) {
      return { valido: false, advertencia: 'El comentario no puede estar vacío' };
    }

    if (texto.length > 1000) {
      return { valido: false, advertencia: 'El comentario no puede exceder 1000 caracteres' };
    }

    // ⚠️ Nota: La censura real se hace en el servidor
    // Aquí solo validamos formato
    return { valido: true };
  }
}
