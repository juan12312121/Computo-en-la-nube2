// src/app/services/fotos.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AutenticacionService, Usuario } from '../autenticacion/autenticacion'; // ajusta la ruta si es necesario

/* --- Interfaces (tipado) --- */
export interface UsuarioMini {
  nombre_completo: string;
  nombre_usuario: string;
}

export interface PublicacionFoto {
  id: number;
  url: string | null;
  descripcion: string;
  fecha: string | null; // proviene de fecha_creacion en el backend
  tipo: 'publicacion';
}

export interface FotoTipo {
  url: string;
  tipo: 'perfil' | 'portada';
  existe?: boolean;
}

export interface FotosData {
  usuario: UsuarioMini;
  fotos: {
    perfil: FotoTipo | null;
    portada: FotoTipo | null;
    publicaciones: PublicacionFoto[];
  };
  estadisticas: {
    total_fotos: number;
    fotos_perfil?: number;
    fotos_portada?: number;
    fotos_publicaciones: number;
  };
}

interface ApiFotosResponse {
  success: boolean;
  data: FotosData;
}

interface VerificarResponse {
  success: boolean;
  data: {
    existe: boolean;
    ruta: string;
    url_completa: string;
    tipo: string;
    filename: string;
  };
}

/* --- Servicio --- */
@Injectable({
  providedIn: 'root'
})
export class FotosService {

  // Detecta la base URL como en tu servicio de autenticación (sin environment)
  private baseUrl: string;

  constructor(
    private http: HttpClient,
    private authService: AutenticacionService
  ) {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      this.baseUrl = 'http://localhost:3000';
    } else {
      // Cambia esta IP/host si necesitas otro en producción
      this.baseUrl = 'http://13.59.190.199:3000';
    }
  }

  /**
   * Construye headers y agrega Authorization si hay token.
   * Toma token de: argumento providedToken > authService.getToken() > localStorage fallback
   */
  private buildAuthHeaders(providedToken?: string): HttpHeaders {
    const token = providedToken || this.authService.getToken() || localStorage.getItem('token');
    let headers = new HttpHeaders({ 'Accept': 'application/json' });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  /**
   * GET /api/fotos/mis-fotos
   * Requiere token (se toma automáticamente desde AutenticacionService)
   */
  getMisFotos(providedToken?: string): Observable<FotosData> {
    const url = `${this.baseUrl}/api/fotos/mis-fotos`;
    const headers = this.buildAuthHeaders(providedToken);

    return this.http.get<ApiFotosResponse>(url, { headers }).pipe(
      map(resp => {
        if (!resp || !resp.success) {
          throw new Error('Respuesta inválida del servidor');
        }
        return resp.data;
      }),
      catchError(err => {
        console.error('FotosService.getMisFotos error:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * GET /api/fotos/usuario/:usuario_id (público)
   */
  getFotosUsuario(usuarioId: number | string): Observable<FotosData> {
    const url = `${this.baseUrl}/api/fotos/usuario/${usuarioId}`;
    return this.http.get<ApiFotosResponse>(url).pipe(
      map(resp => {
        if (!resp || !resp.success) {
          throw new Error('Respuesta inválida del servidor');
        }
        return resp.data;
      }),
      catchError(err => {
        console.error('FotosService.getFotosUsuario error:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * GET /api/fotos/verificar/:tipo/:filename (público)
   */
  verificarArchivo(tipo: 'perfil' | 'portada' | 'publicacion', filename: string): Observable<VerificarResponse['data']> {
    const url = `${this.baseUrl}/api/fotos/verificar/${encodeURIComponent(tipo)}/${encodeURIComponent(filename)}`;
    return this.http.get<VerificarResponse>(url).pipe(
      map(resp => {
        if (!resp || !resp.success) {
          throw new Error('Respuesta inválida del servidor');
        }
        return resp.data;
      }),
      catchError(err => {
        // En caso de error, devolvemos un objeto normalizado para no romper la UI
        console.warn('FotosService.verificarArchivo fallback:', err);
        return of({
          existe: false,
          ruta: `/uploads/${tipo}/${filename}`,
          url_completa: `${this.baseUrl}/uploads/${tipo}/${filename}`,
          tipo,
          filename
        });
      })
    );
  }
}
