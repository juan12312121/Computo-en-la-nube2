import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Usuario } from '../../modelos/usuario.model';

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

// Interfaces movidas a usuario.model.ts

@Injectable({
  providedIn: 'root'
})
export class AutenticacionService {
  private apiUrl: string;
  private currentUserSubject: BehaviorSubject<Usuario | null>;
  public currentUser: Observable<Usuario | null>;

  constructor(private http: HttpClient) {
    this.apiUrl = environment.apiUrl + '/auth';

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