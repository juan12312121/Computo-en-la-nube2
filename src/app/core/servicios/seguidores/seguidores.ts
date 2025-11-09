import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { AutenticacionService } from '../autenticacion/autenticacion';

// ============================================
// INTERFACES - ACTUALIZADAS PARA BACKEND
// ============================================

export interface UsuarioSeguidor {
  id: number;
  nombre_usuario: string;
  nombre_completo: string;
  foto_perfil_url?: string;
  foto_perfil_s3?: string;
  siguiendo_desde?: string;
}

// Respuesta estándar del backend
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  mensaje?: string;
}

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
    const host = window.location.hostname;
    this.apiUrl = host === 'localhost' || host === '127.0.0.1'
      ? 'http://localhost:3000/api/seguidores'
      : 'http://3.146.83.30:3000/api/seguidores';
    
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
    console.log('📤 URL:', url);
    
    return this.http.get<ApiResponse<ListaSeguidoresData>>(url, {
      headers: this.getHeaders()
    }).pipe(
      tap(response => {
        console.log('========================================');
        console.log('✅ RESPUESTA SEGUIDORES');
        console.log('========================================');
        console.log('📦 Response completo:', response);
        console.log('✔️ Success:', response.success);
        console.log('📊 Data:', response.data);
        console.log('👥 Seguidores array:', response.data?.seguidores);
        console.log('🔢 Total:', response.data?.total);
        console.log('📋 Cantidad en array:', response.data?.seguidores?.length || 0);
        console.log('========================================');
      })
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
    console.log('📤 URL:', url);
    
    return this.http.get<ApiResponse<ListaSeguidosData>>(url, {
      headers: this.getHeaders()
    }).pipe(
      tap(response => {
        console.log('========================================');
        console.log('✅ RESPUESTA SEGUIDOS');
        console.log('========================================');
        console.log('📦 Response completo:', response);
        console.log('✔️ Success:', response.success);
        console.log('📊 Data:', response.data);
        console.log('👥 Seguidos array:', response.data?.seguidos);
        console.log('🔢 Total:', response.data?.total);
        console.log('📋 Cantidad en array:', response.data?.seguidos?.length || 0);
        console.log('========================================');
      })
    );
  }

  /**
   * ========================================
   * OBTENER ESTADÍSTICAS
   * ========================================
   * GET /api/seguidores/estadisticas/:usuario_id
   */
  obtenerEstadisticas(usuario_id: number): Observable<ApiResponse<EstadisticasData>> {
    const url = `${this.apiUrl}/estadisticas/${usuario_id}`;
    
    console.log('📊 Obteniendo estadísticas de usuario:', usuario_id);
    console.log('📤 URL:', url);
    
    return this.http.get<ApiResponse<EstadisticasData>>(url, {
      headers: this.getHeaders()
    }).pipe(
      tap(response => {
        console.log('✅ Estadísticas obtenidas:', {
          seguidores: response.data?.seguidores || 0,
          seguidos: response.data?.seguidos || 0
        });
        console.log('📦 Respuesta completa:', response);
      })
    );
  }
}