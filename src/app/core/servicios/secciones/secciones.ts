// core/servicios/secciones/secciones.service.ts
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { AutenticacionService } from '../autenticacion/autenticacion';

// ==================== INTERFACES ====================

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
  message?: string;
  error?: string;
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

export interface SeccionConPosts {
  seccion: Section;
  posts: any[];
}

export interface SeccionesDePostResponse {
  publicacion_id: number;
  secciones: Section[];
  total: number;
}

// ==================== SERVICIO ====================

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
    }).pipe(
      tap(response => {
        if (response.success) {
          console.log('✅ Sección creada exitosamente:', response);
          // Recargar las secciones después de crear una nueva
          this.cargarSecciones();
        }
      })
    );
  }

  /**
   * Obtener todas las secciones del usuario autenticado
   * GET /api/secciones
   */
  obtenerSecciones(): Observable<Section[]> {
    console.log('🌐 GET secciones:', this.apiUrl);
    
    return this.http.get<Section[]>(this.apiUrl, {
      headers: this.getHeaders()
    }).pipe(
      tap(secciones => {
        console.log('✅ Secciones obtenidas:', secciones.length);
        this.seccionesSubject.next(secciones);
      })
    );
  }

  /**
   * Obtener una sección específica con sus posts
   * GET /api/secciones/:id
   */
  obtenerSeccion(id: number): Observable<SeccionConPosts> {
    const url = `${this.apiUrl}/${id}`;
    console.log('🌐 GET sección:', url);
    
    return this.http.get<SeccionConPosts>(url, {
      headers: this.getHeaders()
    }).pipe(
      tap(data => {
        console.log('✅ Sección obtenida:', data.seccion.nombre);
        console.log('📄 Posts en sección:', data.posts.length);
      })
    );
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
    }).pipe(
      tap(response => {
        if (response.success) {
          console.log('✅ Sección actualizada exitosamente');
          this.cargarSecciones();
        }
      })
    );
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
    }).pipe(
      tap(response => {
        if (response.success) {
          console.log('✅ Sección eliminada exitosamente');
          this.cargarSecciones();
        }
      })
    );
  }

  // ==================== OPERACIONES DE RELACIÓN SECCIONES-POSTS ====================

  /**
   * Agregar un post a una sección
   * POST /api/secciones/posts/agregar
   */
  agregarPostASeccion(datos: AgregarPostRequest): Observable<CrearSeccionResponse> {
    const url = `${this.apiUrl}/posts/agregar`;
    console.log('🌐 POST agregar post a sección:', url);
    console.log('📦 Datos:', datos);
    
    return this.http.post<CrearSeccionResponse>(url, datos, {
      headers: this.getHeaders()
    }).pipe(
      tap(response => {
        if (response.success) {
          console.log('✅ Post agregado a sección exitosamente');
        } else {
          console.warn('⚠️ Error al agregar post:', response.error || response.mensaje);
        }
      })
    );
  }

  /**
   * Quitar un post de una sección
   * POST /api/secciones/posts/quitar
   */
  quitarPostDeSeccion(datos: QuitarPostRequest): Observable<CrearSeccionResponse> {
    const url = `${this.apiUrl}/posts/quitar`;
    console.log('🌐 POST quitar post de sección:', url);
    console.log('📦 Datos:', datos);
    
    return this.http.post<CrearSeccionResponse>(url, datos, {
      headers: this.getHeaders()
    }).pipe(
      tap(response => {
        if (response.success) {
          console.log('✅ Post removido de sección exitosamente');
        } else {
          console.warn('⚠️ Error al quitar post:', response.error || response.mensaje);
        }
      })
    );
  }

  /**
   * Obtener todas las secciones de un post específico
   * GET /api/secciones/posts/:publicacion_id
   */
  obtenerSeccionesDePost(publicacionId: number): Observable<SeccionesDePostResponse> {
    const url = `${this.apiUrl}/posts/${publicacionId}`;
    console.log('🌐 GET secciones del post:', url);
    
    return this.http.get<SeccionesDePostResponse>(url, {
      headers: this.getHeaders()
    }).pipe(
      tap(data => {
        console.log(`✅ Post ${publicacionId} está en ${data.total} sección(es)`);
      })
    );
  }

  // ==================== MÉTODOS AUXILIARES ====================

  /**
   * Cargar secciones y actualizar el BehaviorSubject
   */
  cargarSecciones(): void {
    this.obtenerSecciones().subscribe({
      next: (secciones) => {
        console.log('🔄 Secciones actualizadas en caché');
      },
      error: (error) => {
        console.error('❌ Error al cargar secciones:', error);
      }
    });
  }

  /**
   * Actualizar lista de secciones manualmente en el BehaviorSubject
   */
  actualizarSecciones(secciones: Section[]): void {
    this.seccionesSubject.next(secciones);
    console.log('🔄 Secciones actualizadas manualmente:', secciones.length);
  }

  /**
   * Obtener el valor actual de las secciones desde el caché
   */
  obtenerSeccionesActuales(): Section[] {
    return this.seccionesSubject.value;
  }

  /**
   * Verificar si un post está en una sección específica
   */
  postEstaEnSeccion(publicacionId: number, seccionId: number): Observable<boolean> {
    return new Observable(observer => {
      this.obtenerSeccionesDePost(publicacionId).subscribe({
        next: (data) => {
          const estaEnSeccion = data.secciones.some(s => s.id === seccionId);
          observer.next(estaEnSeccion);
          observer.complete();
        },
        error: (error) => {
          observer.error(error);
        }
      });
    });
  }

  /**
   * Agregar múltiples posts a una sección
   */
  agregarMultiplesPostsASeccion(seccionId: number, publicacionIds: number[]): Observable<any[]> {
    const requests = publicacionIds.map(publicacionId => 
      this.agregarPostASeccion({ seccion_id: seccionId, publicacion_id: publicacionId })
    );
    
    return new Observable(observer => {
      const resultados: any[] = [];
      let completados = 0;
      
      requests.forEach((request, index) => {
        request.subscribe({
          next: (response) => {
            resultados.push({ index, success: true, response });
            completados++;
            if (completados === requests.length) {
              observer.next(resultados);
              observer.complete();
            }
          },
          error: (error) => {
            resultados.push({ index, success: false, error });
            completados++;
            if (completados === requests.length) {
              observer.next(resultados);
              observer.complete();
            }
          }
        });
      });
    });
  }

  /**
   * Limpiar caché de secciones
   */
  limpiarCache(): void {
    this.seccionesSubject.next([]);
    console.log('🗑️ Caché de secciones limpiado');
  }
}