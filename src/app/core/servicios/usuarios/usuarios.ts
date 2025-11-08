import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AutenticacionService, Usuario } from '../autenticacion/autenticacion';

// Interfaces
export interface ApiResponse<T> {
  success: boolean;
  mensaje: string;
  data: T;
}

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

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private apiUrl: string;

  constructor(
    private http: HttpClient,
    private authService: AutenticacionService
  ) {
    // ✅ Detecta automáticamente si estás en local o en producción
    const host = window.location.hostname;

    if (host === 'localhost' || host === '127.0.0.1') {
      this.apiUrl = 'http://localhost:3000/api/usuarios'; // entorno local
    } else {
      this.apiUrl = 'http://3.146.83.30:3000/api/usuarios'; // producción
    }
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

  // Obtener mi perfil
  obtenerMiPerfil(): Observable<ApiResponse<Usuario>> {
    return this.http.get<ApiResponse<Usuario>>(`${this.apiUrl}/me`, {
      headers: this.getHeaders()
    });
  }

  // Obtener perfil de otro usuario
  obtenerPerfil(id: number): Observable<ApiResponse<Usuario>> {
    return this.http.get<ApiResponse<Usuario>>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    });
  }

  // Actualizar mi perfil (acepta tanto objeto como FormData)
  actualizarPerfil(datos: ActualizarPerfilRequest | FormData): Observable<ApiResponse<Usuario>> {
    // Si es FormData, no incluir Content-Type (el browser lo maneja automáticamente con boundary)
    const isFormData = datos instanceof FormData;
    
    return this.http.put<ApiResponse<Usuario>>(`${this.apiUrl}/me`, datos, {
      headers: this.getHeaders(!isFormData)
    }).pipe(
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
    });
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
} 