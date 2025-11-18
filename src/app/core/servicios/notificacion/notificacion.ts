import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, NgZone } from '@angular/core';
import { Observable, Subject, tap } from 'rxjs';
import { AutenticacionService } from '../autenticacion/autenticacion';

// ============================================
// INTERFACES
// ============================================
export interface Notificacion {
  id: number;
  usuario_id: number;
  de_usuario_id: number;
  tipo: 'like' | 'comment' | 'follow';
  publicacion_id?: number;
  mensaje: string;
  leida: boolean;
  fecha_creacion: string;
  nombre_usuario: string;
  nombre_completo: string;
  foto_perfil_url?: string;
  foto_perfil_s3?: string;
}

export interface NotificacionResponse {
  success: boolean;
  message?: string;
  mensaje?: string;
  data?: any;
}

export interface ListaNotificacionesResponse {
  success: boolean;
  data: {
    notificaciones: Notificacion[];
    total: number;
    limit: number;
    offset: number;
  };
  message: string;
}

export interface ContadorResponse {
  success: boolean;
  data: {
    total: number;
  };
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificacionesService {
  private apiUrl: string;
  private baseUrl: string;
  
  // ============================================
  // 🆕 SSE - Server-Sent Events
  // ============================================
  private eventSource: EventSource | null = null;
  private nuevaNotificacionSubject = new Subject<Notificacion>();
  private contadorSubject = new Subject<number>();
  private conexionSSESubject = new Subject<boolean>();

  // Observables públicos para suscribirse
  public nuevaNotificacion$ = this.nuevaNotificacionSubject.asObservable();
  public contador$ = this.contadorSubject.asObservable();
  public conexionSSE$ = this.conexionSSESubject.asObservable();

  constructor(
    private http: HttpClient,
    private autenticacionService: AutenticacionService,
    private ngZone: NgZone
  ) {
    const host = window.location.hostname;
    this.baseUrl = host === 'localhost' || host === '127.0.0.1'
      ? 'http://localhost:3000'
      : 'http://3.146.83.30:3000';
    
    this.apiUrl = `${this.baseUrl}/api/notificaciones`;
    
    console.log('🔧 NotificacionesService inicializado');
    console.log('📍 API URL:', this.apiUrl);
  }

  /**
   * ========================================
   * OBTENER HEADERS CON TOKEN
   * ========================================
   */
  private getHeaders(): HttpHeaders {
    const token = this.autenticacionService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * ========================================
   * 🆕 SSE - CONECTAR A NOTIFICACIONES EN TIEMPO REAL
   * ========================================
   */
  conectarSSE(usuarioId: number): void {
    // Si ya hay una conexión activa, cerrarla primero
    if (this.eventSource) {
      console.log('⚠️ Cerrando conexión SSE existente...');
      this.desconectarSSE();
    }

    const token = this.autenticacionService.getToken();
    
    if (!token) {
      console.error('❌ No hay token disponible para SSE');
      return;
    }

    // ✅ Pasar el token como query parameter porque EventSource no soporta headers
    const sseUrl = `${this.apiUrl}/stream/${usuarioId}?token=${encodeURIComponent(token)}`;
    
    console.log('🔌 Conectando a SSE para usuario:', usuarioId);

    // Crear EventSource con el token en la URL
    this.eventSource = new EventSource(sseUrl);

    // Evento: Conexión establecida
    this.eventSource.addEventListener('connected', (event: any) => {
      this.ngZone.run(() => {
        console.log('✅ Conectado a SSE:', JSON.parse(event.data));
        this.conexionSSESubject.next(true);
      });
    });

    // Evento: Nueva notificación
    this.eventSource.addEventListener('nueva_notificacion', (event: any) => {
      this.ngZone.run(() => {
        const notificacion: Notificacion = JSON.parse(event.data);
        console.log('🔔 Nueva notificación recibida:', notificacion);
        this.nuevaNotificacionSubject.next(notificacion);
        
        // Opcional: Mostrar notificación del navegador
        this.mostrarNotificacionNavegador(notificacion);
      });
    });

    // Evento: Actualizar contador
    this.eventSource.addEventListener('actualizar_contador', (event: any) => {
      this.ngZone.run(() => {
        const { total } = JSON.parse(event.data);
        console.log('🔢 Contador actualizado:', total);
        this.contadorSubject.next(total);
      });
    });

    // Manejo de errores
    this.eventSource.onerror = (error) => {
      this.ngZone.run(() => {
        console.error('❌ Error en SSE:', error);
        this.conexionSSESubject.next(false);
        
        // Intentar reconectar después de 5 segundos
        setTimeout(() => {
          console.log('🔄 Intentando reconectar SSE...');
          this.conectarSSE(usuarioId);
        }, 5000);
      });
    };

    // Detectar cuando se abre la conexión
    this.eventSource.onopen = () => {
      this.ngZone.run(() => {
        console.log('🌐 Conexión SSE abierta');
      });
    };
  }

  /**
   * ========================================
   * 🆕 SSE - DESCONECTAR
   * ========================================
   */
  desconectarSSE(): void {
    if (this.eventSource) {
      console.log('🔌 Desconectando SSE...');
      this.eventSource.close();
      this.eventSource = null;
      this.conexionSSESubject.next(false);
    }
  }

  /**
   * ========================================
   * 🆕 MOSTRAR NOTIFICACIÓN DEL NAVEGADOR
   * ========================================
   */
  private mostrarNotificacionNavegador(notificacion: Notificacion): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      const iconos: { [key: string]: string } = {
        'like': '❤️',
        'comment': '💬',
        'follow': '👥'
      };
      
      new Notification(`${iconos[notificacion.tipo]} ${notificacion.nombre_completo}`, {
        body: notificacion.mensaje,
        icon: notificacion.foto_perfil_url || notificacion.foto_perfil_s3 || '/assets/default-avatar.png',
        tag: `notificacion-${notificacion.id}`
      });
    }
  }

  /**
   * ========================================
   * 🆕 SOLICITAR PERMISO PARA NOTIFICACIONES
   * ========================================
   */
  async solicitarPermisoNotificaciones(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('⚠️ Este navegador no soporta notificaciones');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  /**
   * ========================================
   * OBTENER TODAS LAS NOTIFICACIONES
   * ========================================
   * GET /api/notificaciones?limit=20&offset=0
   */
  obtenerTodas(limit: number = 20, offset: number = 0): Observable<ListaNotificacionesResponse> {
    console.log('📬 Obteniendo notificaciones...');
    return this.http.get<ListaNotificacionesResponse>(
      `${this.apiUrl}?limit=${limit}&offset=${offset}`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => console.log('✅ Notificaciones obtenidas:', response.data?.notificaciones?.length || 0))
    );
  }

  /**
   * ========================================
   * OBTENER NOTIFICACIONES NO LEÍDAS
   * ========================================
   * GET /api/notificaciones/no-leidas
   */
  obtenerNoLeidas(): Observable<ListaNotificacionesResponse> {
    console.log('📬 Obteniendo notificaciones no leídas...');
    return this.http.get<ListaNotificacionesResponse>(
      `${this.apiUrl}/no-leidas`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => console.log('✅ Notificaciones no leídas:', response.data?.notificaciones?.length || 0))
    );
  }

  /**
   * ========================================
   * OBTENER CONTADOR DE NO LEÍDAS
   * ========================================
   * GET /api/notificaciones/contador
   * 
   * Útil para mostrar el badge en el icono de notificaciones
   */
  contarNoLeidas(): Observable<ContadorResponse> {
    return this.http.get<ContadorResponse>(
      `${this.apiUrl}/contador`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * ========================================
   * MARCAR UNA NOTIFICACIÓN COMO LEÍDA
   * ========================================
   * PUT /api/notificaciones/:id/leer
   */
  marcarComoLeida(notificacionId: number): Observable<NotificacionResponse> {
    console.log('✅ Marcando notificación como leída:', notificacionId);
    return this.http.put<NotificacionResponse>(
      `${this.apiUrl}/${notificacionId}/leer`,
      {},
      { headers: this.getHeaders() }
    );
  }

  /**
   * ========================================
   * MARCAR TODAS COMO LEÍDAS
   * ========================================
   * PUT /api/notificaciones/leer-todas
   */
  marcarTodasComoLeidas(): Observable<NotificacionResponse> {
    console.log('✅ Marcando todas las notificaciones como leídas');
    return this.http.put<NotificacionResponse>(
      `${this.apiUrl}/leer-todas`,
      {},
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => console.log('✅ Notificaciones actualizadas:', response.data))
    );
  }

  /**
   * ========================================
   * ELIMINAR UNA NOTIFICACIÓN
   * ========================================
   * DELETE /api/notificaciones/:id
   */
  eliminar(notificacionId: number): Observable<NotificacionResponse> {
    console.log('🗑️ Eliminando notificación:', notificacionId);
    return this.http.delete<NotificacionResponse>(
      `${this.apiUrl}/${notificacionId}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * ========================================
   * LIMPIAR NOTIFICACIONES ANTIGUAS
   * ========================================
   * DELETE /api/notificaciones/limpiar-antiguas
   * 
   * Elimina notificaciones con más de 30 días
   */
  limpiarAntiguas(): Observable<NotificacionResponse> {
    console.log('🧹 Limpiando notificaciones antiguas...');
    return this.http.delete<NotificacionResponse>(
      `${this.apiUrl}/limpiar-antiguas`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * ========================================
   * CARGAR MÁS NOTIFICACIONES (Infinite Scroll)
   * ========================================
   */
  cargarMasNotificaciones(
    notificacionesActuales: Notificacion[], 
    limit: number = 20
  ): Observable<ListaNotificacionesResponse> {
    const offset = notificacionesActuales.length;
    console.log('📥 Cargando más notificaciones desde offset:', offset);
    return this.obtenerTodas(limit, offset);
  }

  /**
   * ========================================
   * OBTENER ICONO SEGÚN TIPO DE NOTIFICACIÓN
   * ========================================
   */
  obtenerIconoTipo(tipo: string): string {
    const iconos: { [key: string]: string } = {
      'like': '❤️',
      'comment': '💬',
      'follow': '👥'
    };
    return iconos[tipo] || '🔔';
  }

  /**
   * ========================================
   * OBTENER COLOR SEGÚN TIPO DE NOTIFICACIÓN
   * ========================================
   */
  obtenerColorTipo(tipo: string): string {
    const colores: { [key: string]: string } = {
      'like': 'text-red-500',
      'comment': 'text-blue-500',
      'follow': 'text-green-500'
    };
    return colores[tipo] || 'text-gray-500';
  }

  /**
   * ========================================
   * FORMATEAR TIEMPO TRANSCURRIDO
   * ========================================
   * Convierte fecha a "hace X minutos/horas/días"
   */
  formatearTiempo(fecha: string): string {
    const ahora = new Date();
    const notificacion = new Date(fecha);
    const diferencia = ahora.getTime() - notificacion.getTime();

    const minutos = Math.floor(diferencia / (1000 * 60));
    const horas = Math.floor(diferencia / (1000 * 60 * 60));
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));

    if (minutos < 1) return 'Justo ahora';
    if (minutos < 60) return `Hace ${minutos} min`;
    if (horas < 24) return `Hace ${horas}h`;
    if (dias < 7) return `Hace ${dias}d`;
    if (dias < 30) return `Hace ${Math.floor(dias / 7)} semanas`;
    return `Hace ${Math.floor(dias / 30)} meses`;
  }
}