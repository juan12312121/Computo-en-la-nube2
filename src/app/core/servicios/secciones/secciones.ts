// secciones.service.ts
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AutenticacionService } from '../autenticacion/autenticacion';

export interface Section {
  id: number;
  nombre: string;
  icono: string;
  color: string;
  total_posts: number;
  usuario_id: number;
  fecha_creacion: string;
}

export interface CrearSeccionRequest {
  nombre: string;
  icono?: string;
  color?: string;
}

export interface CrearSeccionResponse {
  success: boolean;
  mensaje?: string;
  seccion_id?: number;
  seccion?: Section;
}

export interface AgregarPostRequest {
  seccion_id: number;
  publicacion_id: number;
}

export interface QuitarPostRequest {
  seccion_id: number;
  publicacion_id: number;
}

@Injectable({
  providedIn: 'root'
})
export class SeccionesService {
  private apiUrl: string;
  private seccionesSubject = new BehaviorSubject<Section[]>([]);
  public secciones$ = this.seccionesSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AutenticacionService
  ) {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      this.apiUrl = 'http://localhost:3000/api/secciones';
    } else {
      this.apiUrl = 'http://3.146.83.30:3000/api/secciones';
    }
    console.log('🔧 SeccionesService inicializado con URL:', this.apiUrl);
  }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // ==================== OPERACIONES CRUD DE SECCIONES ====================

  /**
   * Crear nueva sección
   * POST /api/secciones
   */
  crearSeccion(datos: CrearSeccionRequest): Observable<CrearSeccionResponse> {
    console.log('🌐 POST crear sección:', this.apiUrl);
    console.log('📦 Datos a enviar:', datos);
    
    return this.http.post<CrearSeccionResponse>(this.apiUrl, datos, {
      headers: this.getHeaders()
    });
  }

  /**
   * Obtener todas las secciones del usuario autenticado
   * GET /api/secciones
   */
  obtenerSecciones(): Observable<Section[]> {
    console.log('🌐 GET secciones:', this.apiUrl);
    
    return this.http.get<Section[]>(this.apiUrl, {
      headers: this.getHeaders()
    });
  }

  /**
   * Obtener una sección específica con sus posts
   * GET /api/secciones/:id
   */
  obtenerSeccion(id: number): Observable<any> {
    const url = `${this.apiUrl}/${id}`;
    console.log('🌐 GET sección:', url);
    
    return this.http.get<any>(url, {
      headers: this.getHeaders()
    });
  }

  /**
   * Actualizar sección
   * PUT /api/secciones/:id
   */
  actualizarSeccion(id: number, datos: Partial<CrearSeccionRequest>): Observable<CrearSeccionResponse> {
    const url = `${this.apiUrl}/${id}`;
    console.log('🌐 PUT actualizar sección:', url);
    console.log('📦 Datos a enviar:', datos);
    
    return this.http.put<CrearSeccionResponse>(url, datos, {
      headers: this.getHeaders()
    });
  }

  /**
   * Eliminar sección
   * DELETE /api/secciones/:id
   */
  eliminarSeccion(id: number): Observable<CrearSeccionResponse> {
    const url = `${this.apiUrl}/${id}`;
    console.log('🌐 DELETE eliminar sección:', url);
    
    return this.http.delete<CrearSeccionResponse>(url, {
      headers: this.getHeaders()
    });
  }

  // ==================== OPERACIONES DE RELACIÓN SECCIONES-POSTS ====================

  /**
   * Agregar un post a una sección
   * POST /api/secciones/posts/agregar
   */
  agregarPostASeccion(datos: AgregarPostRequest): Observable<any> {
    const url = `${this.apiUrl}/posts/agregar`;
    console.log('🌐 POST agregar post a sección:', url);
    console.log('📦 Datos a enviar:', datos);
    
    return this.http.post<any>(url, datos, {
      headers: this.getHeaders()
    });
  }

  /**
   * Quitar un post de una sección
   * POST /api/secciones/posts/quitar
   */
  quitarPostDeSeccion(datos: QuitarPostRequest): Observable<any> {
    const url = `${this.apiUrl}/posts/quitar`;
    console.log('🌐 POST quitar post de sección:', url);
    console.log('📦 Datos a enviar:', datos);
    
    return this.http.post<any>(url, datos, {
      headers: this.getHeaders()
    });
  }

  /**
   * Obtener todas las secciones de un post específico
   * GET /api/secciones/posts/:publicacion_id
   */
  obtenerSeccionesDePost(publicacionId: number): Observable<any> {
    const url = `${this.apiUrl}/posts/${publicacionId}`;
    console.log('🌐 GET secciones del post:', url);
    
    return this.http.get<any>(url, {
      headers: this.getHeaders()
    });
  }

  // ==================== MÉTODOS AUXILIARES ====================

  /**
   * Actualizar lista de secciones en el BehaviorSubject
   */
  actualizarSecciones(secciones: Section[]): void {
    this.seccionesSubject.next(secciones);
  }

  /**
   * Obtener el valor actual de las secciones
   */
  obtenerSeccionesActuales(): Section[] {
    return this.seccionesSubject.value;
  }
}