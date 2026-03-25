import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Usuario } from '../../modelos/usuario.model';
import { ApiResponse } from '../../modelos/api-response.model';
import { AutenticacionService } from '../autenticacion/autenticacion';

// Interfaces
// Interfaces movidas a modelos/

export interface ActualizarPerfilRequest {
  nombre_completo?: string;
  biografia?: string;
  ubicacion?: string;
  carrera?: string;
}

export interface UsuarioBusqueda {
  id: number;
  nombre_usuario: string;
  nombre_completo: string;
  foto_perfil_url?: string;
  carrera?: string;
}

export interface UsuarioActivo {
  id: number;
  nombre_usuario: string;
  nombre_completo: string;
  foto_perfil_url?: string;
  activo: number;
  carrera?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private apiUrl: string;

  constructor(
    private http: HttpClient,
    private authService: AutenticacionService
  ) {
    this.apiUrl = environment.apiUrl + '/usuarios';
  }

  // Headers con token (sin Content-Type para FormData)
  private getHeaders(includeContentType: boolean = true): HttpHeaders {
    const token = this.authService.getToken();
    if (includeContentType) {
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
    }
    // Para FormData, no incluir Content-Type (el browser lo configura automáticamente)
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  private resolveUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    if (url.startsWith('/uploads')) {
      return `${environment.socketUrl}${url}`;
    }
    return url;
  }

  private mapUsuario(usuario: Usuario): Usuario {
    if (!usuario) return usuario;
    return {
      ...usuario,
      foto_perfil_url: this.resolveUrl(usuario.foto_perfil_url),
      foto_portada_url: this.resolveUrl(usuario.foto_portada_url)
    };
  }

  // Obtener mi perfil
  obtenerMiPerfil(): Observable<ApiResponse<Usuario>> {
    return this.http.get<ApiResponse<Usuario>>(`${this.apiUrl}/me`, {
      headers: this.getHeaders()
    }).pipe(
      map(res => ({
        ...res,
        data: res.data ? this.mapUsuario(res.data) : (null as any)
      }))
    );
  }

  // Obtener perfil de otro usuario
  obtenerPerfil(id: number): Observable<ApiResponse<Usuario>> {
    return this.http.get<ApiResponse<Usuario>>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      map(res => ({
        ...res,
        data: res.data ? this.mapUsuario(res.data) : (null as any)
      }))
    );
  }

  // Actualizar mi perfil (acepta tanto objeto como FormData)
  actualizarPerfil(datos: ActualizarPerfilRequest | FormData): Observable<ApiResponse<Usuario>> {
    const isFormData = datos instanceof FormData;

    return this.http.put<ApiResponse<Usuario>>(`${this.apiUrl}/me`, datos, {
      headers: this.getHeaders(!isFormData)
    }).pipe(
      map(res => ({
        ...res,
        data: res.data ? this.mapUsuario(res.data) : (null as any)
      })),
      tap(response => {
        if (response.success && response.data) {
          this.authService.actualizarUsuarioEnSesion(response.data);
        }
      })
    );
  }

  // Buscar usuarios
  buscarUsuarios(termino: string): Observable<ApiResponse<UsuarioBusqueda[]>> {
    return this.http.get<ApiResponse<UsuarioBusqueda[]>>(`${this.apiUrl}/buscar?q=${termino}`, {
      headers: this.getHeaders()
    }).pipe(
      map(res => ({
        ...res,
        data: res.data ? res.data.map(u => ({
          ...u,
          foto_perfil_url: this.resolveUrl(u.foto_perfil_url)
        })) : []
      }))
    );
  }

  // Eliminar mi cuenta
  eliminarCuenta(): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/me`, {
      headers: this.getHeaders()
    }).pipe(
      tap(response => {
        if (response.success) {
          this.authService.limpiarSesion();
        }
      })
    );
  }

  // ================= MÉTODOS DE ACTIVIDAD =================

  // 👉 Obtener MIS seguidores activos (activo = 1)
  obtenerSeguidoresActivos(): Observable<ApiResponse<UsuarioActivo[]>> {
    return this.http.get<ApiResponse<UsuarioActivo[]>>(`${this.apiUrl}/me/seguidores/activos`, {
      headers: this.getHeaders()
    }).pipe(
      map(res => ({
        ...res,
        data: res.data ? res.data.map(u => ({
          ...u,
          foto_perfil_url: this.resolveUrl(u.foto_perfil_url)
        })) : []
      }))
    );
  }

  // Obtener todos los usuarios activos (general)
  obtenerUsuariosActivos(): Observable<ApiResponse<UsuarioActivo[]>> {
    return this.http.get<ApiResponse<UsuarioActivo[]>>(`${this.apiUrl}/activos`, {
      headers: this.getHeaders()
    }).pipe(
      map(res => ({
        ...res,
        data: res.data ? res.data.map(u => ({
          ...u,
          foto_perfil_url: this.resolveUrl(u.foto_perfil_url)
        })) : []
      }))
    );
  }

  // Actualizar estado de actividad (1 = activo, 0 = inactivo)
  actualizarActividad(activo: number): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(
      `${this.apiUrl}/me/actividad`,
      { activo },
      { headers: this.getHeaders() }
    );
  }

  // Enviar heartbeat para mantener sesión activa
  enviarHeartbeat(): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/me/heartbeat`,
      { activo: 1, timestamp: new Date() },
      { headers: this.getHeaders() }
    );
  }
}