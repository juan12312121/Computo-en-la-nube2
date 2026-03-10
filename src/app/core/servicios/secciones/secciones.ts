import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Section, CrearSeccionRequest, SeccionConPosts, AgregarPostRequest, QuitarPostRequest } from '../../modelos/seccion.model';
import { ApiResponse } from '../../modelos/api-response.model';

import { AutenticacionService } from '../autenticacion/autenticacion';

// ==================== INTERFACES ====================

// Interfaces movidas a modelos/
export interface CrearSeccionResponse extends ApiResponse<any> {
  seccion_id?: number;
  seccion?: Section;
}

export interface SeccionesDePostResponse {
  publicacion_id: number;
  secciones: Section[];
  total: number;
}

export interface SeccionesPublicasResponse {
  usuario_id: number;
  secciones: Section[];
  total: number;
  es_propietario: boolean;
}

export interface SeccionPublicaConPosts {
  seccion: Section;
  posts: any[];
  es_propietario: boolean;
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
    this.apiUrl = environment.apiUrl + '/secciones';
    console.log('🔧 SeccionesService inicializado con URL:', this.apiUrl);
  }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // ==================== MÉTODOS PÚBLICOS (NUEVOS) ====================

  /**
   * Obtener secciones públicas de otro usuario
   * GET /api/secciones/usuario/:usuario_id
   * NO requiere autenticación
   */
  obtenerSeccionesDeUsuario(usuarioId: number): Observable<SeccionesPublicasResponse> {
    const url = `${this.apiUrl}/usuario/${usuarioId}`;
    console.log('🌐 GET secciones públicas de usuario:', url);

    return this.http.get<SeccionesPublicasResponse>(url).pipe(
      tap(data => {
        console.log(`✅ Secciones públicas de usuario ${usuarioId}:`, data.total);
      })
    );
  }

  /**
   * Obtener una sección pública específica con sus posts
   * GET /api/secciones/usuario/:usuario_id/seccion/:seccion_id
   * NO requiere autenticación
   */
  obtenerSeccionPublica(usuarioId: number, seccionId: number): Observable<SeccionPublicaConPosts> {
    const url = `${this.apiUrl}/usuario/${usuarioId}/seccion/${seccionId}`;
    console.log('🌐 GET sección pública:', url);

    return this.http.get<SeccionPublicaConPosts>(url).pipe(
      tap(data => {
        console.log('✅ Sección pública obtenida:', data.seccion.nombre);
        console.log('📄 Posts en sección:', data.posts.length);
      })
    );
  }

  // ==================== OPERACIONES CRUD DE SECCIONES (PRIVADAS) ====================

  /**
   * Crear nueva sección
   * POST /api/secciones
   * Requiere autenticación
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
          this.cargarSecciones();
        }
      })
    );
  }

  /**
   * Obtener todas las secciones del usuario autenticado
   * GET /api/secciones
   * Requiere autenticación
   */
  obtenerSecciones(): Observable<Section[]> {
    console.log('🌐 GET mis secciones:', this.apiUrl);

    return this.http.get<Section[]>(this.apiUrl, {
      headers: this.getHeaders()
    }).pipe(
      tap(secciones => {
        console.log('✅ Mis secciones obtenidas:', secciones.length);
        this.seccionesSubject.next(secciones);
      })
    );
  }

  // ✅ NUEVO MÉTODO: Obtener secciones de otro usuario
  obtenerSeccionesUsuario(usuarioId: number): Observable<Section[]> {
    const url = `${this.apiUrl}/usuario/${usuarioId}`;
    console.log('🌐 GET secciones del usuario:', url);

    return this.http.get<any>(url, {
      headers: this.getHeaders()
    }).pipe(
      map((res: any) => {
        // El backend devuelve { usuario_id, secciones, total, es_propietario }
        // O directamente el array si es la ruta privada (pero esta es la pública)
        const secciones = res.secciones || (Array.isArray(res) ? res : []);
        console.log(`✅ Secciones del usuario ${usuarioId} procesadas:`, secciones.length);
        return secciones;
      })
    );
  }

  // ✅ MÉTODO AUXILIAR: Obtener secciones (propias o de otro usuario)
  obtenerSeccionesSegun(usuarioId?: number): Observable<Section[]> {
    if (!usuarioId) {
      return this.obtenerSecciones();
    }
    return this.obtenerSeccionesUsuario(usuarioId);
  }

  /**
   * Obtener una sección específica con sus posts (privado)
   * GET /api/secciones/:id
   * Requiere autenticación
   */
  obtenerSeccion(id: number): Observable<SeccionConPosts> {
    const url = `${this.apiUrl}/${id}`;
    console.log('🌐 GET mi sección:', url);

    return this.http.get<SeccionConPosts>(url, {
      headers: this.getHeaders()
    }).pipe(
      tap(data => {
        console.log('✅ Mi sección obtenida:', data.seccion.nombre);
        console.log('📄 Posts en sección:', data.posts.length);
      })
    );
  }

  /**
   * Actualizar sección
   * PUT /api/secciones/:id
   * Requiere autenticación
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
   * Requiere autenticación
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
   * Requiere autenticación
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
   * Requiere autenticación
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
   * Requiere autenticación
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