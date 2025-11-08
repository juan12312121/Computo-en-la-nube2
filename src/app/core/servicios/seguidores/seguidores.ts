import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AutenticacionService } from '../autenticacion/autenticacion';

// Interfaces
export interface SeguidorResponse {
  success: boolean;
  mensaje?: string;
  message?: string;
  following?: boolean;
}

export interface VerificarResponse {
  success: boolean;
  sigue: boolean;
}

export interface UsuarioSeguidor {
  id: number;
  nombre_usuario: string;
  nombre_completo: string;
  foto_perfil_url?: string;
}

export interface ListaSeguidoresResponse {
  total: number;
  seguidores: UsuarioSeguidor[];
}

export interface ListaSeguidosResponse {
  total: number;
  seguidos: UsuarioSeguidor[];
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

    if (host === 'localhost' || host === '127.0.0.1') {
      this.apiUrl = 'http://localhost:3000/api/seguidores';
    } else {
      this.apiUrl = 'http://3.146.83.30:3000/api/seguidores';
    }
    
    console.log('🔧 SeguidorService inicializado con URL:', this.apiUrl);
  }

  // Headers con token
  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    console.log('🔐 Token obtenido:', token ? 'Existe' : 'No existe');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // Toggle seguir/dejar de seguir - CORREGIDO: usa parámetros de ruta
  toggle(seguidor_id: number, siguiendo_id: number): Observable<SeguidorResponse> {
    const url = `${this.apiUrl}/toggle/${seguidor_id}/${siguiendo_id}`;
    
    console.log('🌐 POST toggle:', url);
    console.log('🔑 Headers:', this.getHeaders());
    
    return this.http.post<SeguidorResponse>(url, {}, {
      headers: this.getHeaders()
    });
  }

  // Verificar si un usuario sigue a otro - CORREGIDO: usa parámetros de ruta
  verificar(seguidor_id: number, siguiendo_id: number): Observable<VerificarResponse> {
    const url = `${this.apiUrl}/verificar/${seguidor_id}/${siguiendo_id}`;
    
    console.log('🌐 GET verificar:', url);
    console.log('🔑 Headers:', this.getHeaders());
    
    return this.http.get<VerificarResponse>(url, {
      headers: this.getHeaders()
    });
  }

  // Seguir a un usuario (usando toggle internamente)
  seguir(seguidor_id: number, seguido_id: number): Observable<SeguidorResponse> {
    return this.toggle(seguidor_id, seguido_id);
  }

  // Dejar de seguir a un usuario (usando toggle internamente)
  dejarDeSeguir(seguidor_id: number, seguido_id: number): Observable<SeguidorResponse> {
    return this.toggle(seguidor_id, seguido_id);
  }

  // Obtener lista de seguidores de un usuario
  listarSeguidores(usuario_id: number): Observable<ListaSeguidoresResponse> {
    const url = `${this.apiUrl}/seguidores/${usuario_id}`;
    console.log('🌐 GET seguidores:', url);
    
    return this.http.get<ListaSeguidoresResponse>(url, {
      headers: this.getHeaders()
    });
  }

  // Obtener lista de usuarios seguidos por un usuario
  listarSeguidos(usuario_id: number): Observable<ListaSeguidosResponse> {
    const url = `${this.apiUrl}/seguidos/${usuario_id}`;
    console.log('🌐 GET seguidos:', url);
    
    return this.http.get<ListaSeguidosResponse>(url, {
      headers: this.getHeaders()
    });
  }
}