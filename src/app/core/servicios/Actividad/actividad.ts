import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AutenticacionService } from '../autenticacion/autenticacion';
import { UsuarioService } from '../usuarios/usuarios';

@Injectable({
  providedIn: 'root'
})
export class ActividadService {
  private readonly INTERVALO_HEARTBEAT = 60 * 1000; // 1 minuto

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
        console.log('✅ Usuario autenticado - Iniciando heartbeat');
        this.activarManualmente();
        this.iniciarHeartbeat();
        this.detectorInicializado = true;
      } else if (!usuario && this.detectorInicializado) {
        console.log('⏹️ Usuario desconectado - Deteniendo heartbeat');
        this.detenerHeartbeat();
        this.activo$.next(false);
        this.detectorInicializado = false;
      }
    });
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
   * Detiene el heartbeat
   */
  private detenerHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
      console.log('🛑 Heartbeat detenido');
    }
  }

  /**
   * Observable para saber si el usuario está activo
   */
  obtenerEstadoActividad(): Observable<boolean> {
    return this.activo$.asObservable();
  }

  /**
   * Marca al usuario como activo en el servidor
   */
  activarManualmente(): void {
    if (!this.authService.isAuthenticated()) return;

    this.activo$.next(true);
    this.usuarioService.actualizarActividad(1).subscribe({
      next: () => console.log('✅ Usuario marcado como activo'),
      error: (err) => console.error('❌ Error al activar:', err)
    });
  }
}
