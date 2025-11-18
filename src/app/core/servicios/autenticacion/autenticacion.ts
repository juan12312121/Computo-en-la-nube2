import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';

// Interfaces
export interface LoginRequest {
  email: string;
  contrasena: string;
}

export interface RegistroRequest {
  nombre_usuario: string;
  email: string;
  nombre_completo: string;
  contrasena: string;
}

export interface AuthResponse {
  success: boolean;
  mensaje: string;
  data: {
    usuario: Usuario;
    token: string;
  };
}

export interface Usuario {
  id: number;
  nombre_usuario: string;
  email: string;
  nombre_completo: string;
  biografia?: string;
  ubicacion?: string;
  carrera?: string;
  foto_perfil_url?: string;
  foto_portada_url?: string;
  total_seguidores: number;
  total_siguiendo: number;
  total_posts: number;
  activo: number;
  fecha_creacion: string;
}

@Injectable({
  providedIn: 'root'
})
export class AutenticacionService {
  private apiUrl: string;
  private currentUserSubject: BehaviorSubject<Usuario | null>;
  public currentUser: Observable<Usuario | null>;

  constructor(private http: HttpClient) {
    // ✅ Detecta automáticamente si estás en local o en producción
    const host = window.location.hostname;

    if (host === 'localhost' || host === '127.0.0.1') {
      this.apiUrl = 'http://localhost:3000/api/auth'; // entorno local
    } else {
      this.apiUrl = 'http://3.146.83.30:3000/api/auth'; 
    }

    const storedUser = localStorage.getItem('currentUser');
    this.currentUserSubject = new BehaviorSubject<Usuario | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  // Getter del usuario actual
  public get currentUserValue(): Usuario | null {
    return this.currentUserSubject.value;
  }

  // 🆕 Obtener ID del usuario actual
  obtenerUsuarioId(): number | null {
    const usuario = this.currentUserValue;
    return usuario?.id || null;
  }

  // 🆕 Obtener usuario actual (alias para compatibilidad)
  obtenerUsuarioActual(): Usuario | null {
    return this.currentUserValue;
  }

  // Registro
  registro(datos: RegistroRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/registro`, datos)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.guardarSesion(response.data.usuario, response.data.token);
          }
        })
      );
  }

  // Login
  login(datos: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, datos)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.guardarSesion(response.data.usuario, response.data.token);
          }
        })
      );
  }

  // Logout
  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {})
      .pipe(
        tap(() => {
          this.limpiarSesion();
        })
      );
  }

  // Verificar token
  verificarToken(): Observable<any> {
    return this.http.get(`${this.apiUrl}/verificar`);
  }

  // Guardar sesión
  private guardarSesion(usuario: Usuario, token: string): void {
    localStorage.setItem('currentUser', JSON.stringify(usuario));
    localStorage.setItem('token', token);
    this.currentUserSubject.next(usuario);
  }

  // Limpiar sesión
  limpiarSesion(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
  }

  // Obtener token
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Verificar si está autenticado
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Actualizar usuario en sesión
  actualizarUsuarioEnSesion(usuario: Usuario): void {
    localStorage.setItem('currentUser', JSON.stringify(usuario));
    this.currentUserSubject.next(usuario);
  }
}