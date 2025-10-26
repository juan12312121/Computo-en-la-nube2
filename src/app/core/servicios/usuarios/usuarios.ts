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
  private apiUrl = 'http://localhost:3000/api/usuarios';

  constructor(
    private http: HttpClient,
    private authService: AutenticacionService
  ) {}

  // Headers con token
  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
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

  // Actualizar mi perfil
  actualizarPerfil(datos: ActualizarPerfilRequest): Observable<ApiResponse<Usuario>> {
    return this.http.put<ApiResponse<Usuario>>(`${this.apiUrl}/me`, datos, {
      headers: this.getHeaders()
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