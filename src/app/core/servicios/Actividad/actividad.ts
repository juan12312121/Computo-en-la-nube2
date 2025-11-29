import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, fromEvent, merge, timer } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { AutenticacionService } from '../autenticacion/autenticacion';
import { UsuarioService } from '../usuarios/usuarios';

@Injectable({
  providedIn: 'root'
})
export class ActividadService {
  private readonly TIEMPO_INACTIVIDAD = 5 * 60 * 1000; // 5 minutos
  private readonly INTERVALO_HEARTBEAT = 60 * 1000; // 1 minuto
  
  private ultimaActividad: number = Date.now();
  private activo$ = new BehaviorSubject<boolean>(false);
  private heartbeatTimer: any;
  private detectorInicializado = false;

  constructor(
    private authService: AutenticacionService,
    private usuarioService: UsuarioService
  ) {
    // Inicializar solo si está autenticado
    this.authService.currentUser.subscribe(usuario => {
      if (usuario && !this.detectorInicializado) {
        this.inicializarDetectorActividad();
        this.activarManualmente();
        this.detectorInicializado = true;
      } else if (!usuario && this.detectorInicializado) {
        this.desactivarManualmente();
        this.detectorInicializado = false;
      }
    });
  }

  /**
   * Inicializa los listeners de eventos para detectar actividad del usuario
   */
  private inicializarDetectorActividad(): void {
    // Eventos que indican actividad del usuario
    const eventos$ = merge(
      fromEvent(document, 'mousemove'),
      fromEvent(document, 'mousedown'),
      fromEvent(document, 'keypress'),
      fromEvent(document, 'scroll'),
      fromEvent(document, 'touchstart'),
      fromEvent(document, 'click')
    );

    // Actualizar última actividad con debounce
    eventos$.pipe(
      debounceTime(1000)
    ).subscribe(() => {
      this.registrarActividad();
    });

    // Verificar inactividad cada minuto
    timer(0, 60000).subscribe(() => {
      this.verificarInactividad();
    });

    // Iniciar heartbeat al servidor
    this.iniciarHeartbeat();
  }

  /**
   * Registra que el usuario está activo
   */
  private registrarActividad(): void {
    if (!this.authService.isAuthenticated()) return;

    this.ultimaActividad = Date.now();
    
    if (!this.activo$.value) {
      this.activo$.next(true);
      this.usuarioService.actualizarActividad(1).subscribe({
        next: () => console.log('✅ Usuario marcado como activo'),
        error: (err) => console.error('❌ Error al marcar activo:', err)
      });
    }
  }

  /**
   * Verifica si el usuario está inactivo
   */
  private verificarInactividad(): void {
    if (!this.authService.isAuthenticated()) return;

    const tiempoInactivo = Date.now() - this.ultimaActividad;
    
    if (tiempoInactivo >= this.TIEMPO_INACTIVIDAD && this.activo$.value) {
      this.activo$.next(false);
      this.usuarioService.actualizarActividad(0).subscribe({
        next: () => console.log('⏰ Usuario marcado como inactivo por tiempo'),
        error: (err) => console.error('❌ Error al marcar inactivo:', err)
      });
    }
  }

  /**
   * Inicia el heartbeat que mantiene actualizado el estado en el servidor
   */
  private iniciarHeartbeat(): void {
    if (this.heartbeatTimer) return;

    this.heartbeatTimer = setInterval(() => {
      if (this.authService.isAuthenticated() && this.activo$.value) {
        this.usuarioService.enviarHeartbeat().subscribe({
          next: () => console.log('💓 Heartbeat enviado'),
          error: (err) => console.error('❌ Error en heartbeat:', err)
        });
      }
    }, this.INTERVALO_HEARTBEAT);
  }

  /**
   * Detiene el heartbeat (llamar al cerrar sesión)
   */
  detenerHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Observable para saber si el usuario está activo
   */
  obtenerEstadoActividad(): Observable<boolean> {
    return this.activo$.asObservable();
  }

  /**
   * Fuerza marcar como activo (útil al iniciar sesión)
   */
  activarManualmente(): void {
    if (!this.authService.isAuthenticated()) return;

    this.ultimaActividad = Date.now();
    this.activo$.next(true);
    this.usuarioService.actualizarActividad(1).subscribe({
      next: () => console.log('✅ Usuario activado manualmente'),
      error: (err) => console.error('❌ Error al activar:', err)
    });
  }

  /**
   * Fuerza marcar como inactivo (útil al cerrar sesión)
   */
  desactivarManualmente(): void {
    this.activo$.next(false);
    if (this.authService.isAuthenticated()) {
      this.usuarioService.actualizarActividad(0).subscribe({
        next: () => console.log('👋 Usuario desactivado manualmente'),
        error: (err) => console.error('❌ Error al desactivar:', err)
      });
    }
    this.detenerHeartbeat();
  }
}