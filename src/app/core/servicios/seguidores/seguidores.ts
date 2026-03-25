import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../modelos/api-response.model';
import { AutenticacionService } from '../autenticacion/autenticacion';

// ============================================
// INTERFACES - ACTUALIZADAS PARA BACKEND
// ============================================

import { UsuarioSeguidor } from '../../modelos/seguidor.model';

// Interfaces movidas a modelos/

// Para toggle/seguir/dejar
export interface SeguidorData {
  following: boolean;
}

// Para verificar
export interface VerificarData {
  following: boolean;
}

// Para lista de seguidores
export interface ListaSeguidoresData {
  seguidores: UsuarioSeguidor[];
  total: number;
  limit: number;
  offset: number;
}

// Para lista de seguidos
export interface ListaSeguidosData {
  seguidos: UsuarioSeguidor[];
  total: number;
  limit: number;
  offset: number;
}

// Para estadísticas
export interface EstadisticasData {
  seguidores: number;
  seguidos: number;
}

@Injectable({
  providedIn: 'root'
})
export class SeguidorService {
  private apiUrl: string;

  constructor(
    private http: HttpClient,
    private authService: AutenticacionService
  ) {
    this.apiUrl = environment.apiUrl + '/seguidores';

    console.log('🔧 SeguidorService inicializado con URL:', this.apiUrl);
  }

  /**
   * ========================================
   * OBTENER HEADERS CON TOKEN
   * ========================================
   */
  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    console.log('🔐 Token obtenido:', token ? 'Existe' : 'No existe');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * ========================================
   * TOGGLE SEGUIR/DEJAR DE SEGUIR ✅ CORREGIDO
   * ========================================
   * POST /api/seguidores/toggle
   * Body: { seguido_id: number }
   */
  toggle(seguido_id: number): Observable<ApiResponse<SeguidorData>> {
    const url = `${this.apiUrl}/toggle`;

    console.log('🔄 Toggle seguir usuario:', seguido_id);
    console.log('📤 URL:', url);
    console.log('📤 Body:', { seguido_id });

    return this.http.post<ApiResponse<SeguidorData>>(
      url,
      { seguido_id }, // ✅ Body correcto
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        const accion = response.data?.following ? 'Siguiendo' : 'Dejó de seguir';
        console.log(`✅ ${accion} al usuario ${seguido_id}`);
        console.log('📦 Respuesta completa:', response);
      })
    );
  }

  /**
   * ========================================
   * SEGUIR A UN USUARIO
   * ========================================
   * POST /api/seguidores/seguir
   * Body: { seguido_id: number }
   */
  seguir(seguido_id: number): Observable<ApiResponse<SeguidorData>> {
    const url = `${this.apiUrl}/seguir`;

    console.log('👥 Siguiendo a usuario:', seguido_id);
    console.log('📤 URL:', url);

    return this.http.post<ApiResponse<SeguidorData>>(
      url,
      { seguido_id },
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => console.log('✅ Respuesta seguir:', response))
    );
  }

  /**
   * ========================================
   * DEJAR DE SEGUIR A UN USUARIO
   * ========================================
   * DELETE /api/seguidores/dejar-de-seguir
   * Body: { seguido_id: number }
   */
  dejarDeSeguir(seguido_id: number): Observable<ApiResponse<SeguidorData>> {
    const url = `${this.apiUrl}/dejar-de-seguir`;

    console.log('💔 Dejando de seguir a usuario:', seguido_id);
    console.log('📤 URL:', url);

    return this.http.request<ApiResponse<SeguidorData>>(
      'DELETE',
      url,
      {
        headers: this.getHeaders(),
        body: { seguido_id }
      }
    ).pipe(
      tap(response => console.log('✅ Respuesta dejar de seguir:', response))
    );
  }

  /**
   * ========================================
   * VERIFICAR SI SIGO A UN USUARIO ✅ CORREGIDO
   * ========================================
   * GET /api/seguidores/verificar/:usuario_id
   */
  verificar(usuario_id: number): Observable<ApiResponse<VerificarData>> {
    const url = `${this.apiUrl}/verificar/${usuario_id}`;

    console.log('🔍 Verificando si sigo a usuario:', usuario_id);
    console.log('📤 URL:', url);

    return this.http.get<ApiResponse<VerificarData>>(url, {
      headers: this.getHeaders()
    }).pipe(
      tap(response => {
        console.log('✅ Verificación:', response.data?.following ? 'SÍ sigue' : 'NO sigue');
        console.log('📦 Respuesta completa:', response);
      })
    );
  }

  /**
   * ========================================
   * HELPERS - RESOLVER URLS
   * ========================================
   */
  private resolveUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    // Si es una ruta relativa de perfiles, le ponemos el prefijo del servidor
    if (url.includes('foto_perfil-') || url.includes('perfil-')) {
      return `${environment.socketUrl}/uploads/perfiles/${url}`;
    }
    if (url.startsWith('/uploads')) {
      return `${environment.socketUrl}${url}`;
    }
    return url;
  }

  private mapUsuario(usuario: UsuarioSeguidor): UsuarioSeguidor {
    return {
      ...usuario,
      foto_perfil_url: this.resolveUrl(usuario.foto_perfil_url)
    };
  }

  /**
   * ========================================
   * LISTAR SEGUIDORES ✅ CORREGIDO
   * ========================================
   * GET /api/seguidores/seguidores/:usuario_id?limit=50&offset=0
   */
  listarSeguidores(
    usuario_id: number,
    limit: number = 50,
    offset: number = 0
  ): Observable<ApiResponse<ListaSeguidoresData>> {
    const url = `${this.apiUrl}/seguidores/${usuario_id}?limit=${limit}&offset=${offset}`;

    console.log('📋 Obteniendo seguidores de usuario:', usuario_id);

    return this.http.get<ApiResponse<ListaSeguidoresData>>(url, {
      headers: this.getHeaders()
    }).pipe(
      tap((response: ApiResponse<ListaSeguidoresData>) => console.log('✅ Seguidores obtenidos:', response.data?.seguidores?.length || 0)),
      map((response: ApiResponse<ListaSeguidoresData>) => ({
        ...response,
        data: response.data ? {
          ...response.data,
          seguidores: response.data.seguidores.map((u: UsuarioSeguidor) => this.mapUsuario(u))
        } : (null as any)
      }))
    );
  }

  /**
   * ========================================
   * LISTAR SEGUIDOS ✅ CORREGIDO
   * ========================================
   * GET /api/seguidores/seguidos/:usuario_id?limit=50&offset=0
   */
  listarSeguidos(
    usuario_id: number,
    limit: number = 50,
    offset: number = 0
  ): Observable<ApiResponse<ListaSeguidosData>> {
    const url = `${this.apiUrl}/seguidos/${usuario_id}?limit=${limit}&offset=${offset}`;

    console.log('📋 Obteniendo seguidos de usuario:', usuario_id);

    return this.http.get<ApiResponse<ListaSeguidosData>>(url, {
      headers: this.getHeaders()
    }).pipe(
      tap((response: ApiResponse<ListaSeguidosData>) => console.log('✅ Seguidos obtenidos:', response.data?.seguidos?.length || 0)),
      map((response: ApiResponse<ListaSeguidosData>) => ({
        ...response,
        data: response.data ? {
          ...response.data,
          seguidos: response.data.seguidos.map((u: UsuarioSeguidor) => this.mapUsuario(u))
        } : (null as any)
      }))
    );
  }

  /**
   * ========================================
   * OBTENER ESTADÍSTICAS
   * ========================================
   */
  obtenerEstadisticas(usuario_id: number): Observable<ApiResponse<EstadisticasData>> {
    const url = `${this.apiUrl}/estadisticas/${usuario_id}`;
    return this.http.get<ApiResponse<EstadisticasData>>(url, {
      headers: this.getHeaders()
    });
  }
}