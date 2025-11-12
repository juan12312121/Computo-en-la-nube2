import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { interval, Subject, Subscription } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { Notificacion, NotificacionesService } from '../../core/servicios/notificacion/notificacion';
import { Theme } from '../../core/servicios/temas';

@Component({
  selector: 'app-notificaciones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notificaciones.html',
  styleUrls: ['./notificaciones.css']
})
export class NotificacionesComponent implements OnInit, OnDestroy {
  @Input() currentTheme!: Theme;
  @Input() isMobile = false;
  @Output() close = new EventEmitter<void>();

  // ✅ URLs Base
  public readonly apiBaseUrl = window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : 'http://3.146.83.30:3000';
  public readonly s3BaseUrl = 'https://redstudent-uploads.s3.us-east-2.amazonaws.com';

  // Estado UI
  showNotifications = false;
  cargando = false;
  error = false;

  // Datos
  notificaciones: Notificacion[] = [];
  contadorNoLeidas = 0;

  // Paginación
  limit = 20;
  offset = 0;
  hayMas = true;

  // Subscripciones
  private destroy$ = new Subject<void>();
  private pollingSubscription?: Subscription;

  // Exponer encodeURIComponent al template
  encodeURIComponent = encodeURIComponent;

  constructor(
    private notificacionesService: NotificacionesService,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('🔔 Inicializando componente de notificaciones');
    
    this.detectarMobile();
    this.actualizarContador();
    this.iniciarPolling();
  }

  ngOnDestroy(): void {
    console.log('🔔 Destruyendo componente de notificaciones');
    this.destroy$.next();
    this.destroy$.complete();
    this.pollingSubscription?.unsubscribe();
    this.restaurarScrollBody();
  }

  private detectarMobile(): void {
    this.isMobile = window.innerWidth <= 640;
    console.log('📱 Detectado móvil:', this.isMobile);
  }

  @HostListener('window:resize')
  onResize(): void {
    const wasMobile = this.isMobile;
    this.detectarMobile();
    
    // Si cambió de móvil a desktop o viceversa, cerrar notificaciones
    if (wasMobile !== this.isMobile && this.showNotifications) {
      this.cerrarNotificaciones();
    }
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    if (!this.isMobile && this.showNotifications) {
      const target = event.target as HTMLElement;
      const isInsidePanel = target.closest('.notification-panel');
      const isToggleButton = target.closest('.notification-toggle');
      const isContainer = target.closest('.notification-container');
      
      if (!isInsidePanel && !isToggleButton && !isContainer) {
        this.cerrarNotificaciones();
      }
    }
  }

  private bloquearScrollBody(): void {
    if (this.isMobile) {
      document.body.classList.add('notification-open');
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    }
  }

  private restaurarScrollBody(): void {
    document.body.classList.remove('notification-open');
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
  }

  private iniciarPolling(): void {
    this.pollingSubscription = interval(30000)
      .pipe(
        switchMap(() => this.notificacionesService.contarNoLeidas()),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.contadorNoLeidas = response.data.total;
          }
        },
        error: (error) => {
          console.error('❌ Error en polling de notificaciones:', error);
        }
      });
  }

  private actualizarContador(): void {
    this.notificacionesService.contarNoLeidas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.contadorNoLeidas = response.data.total;
            console.log('🔔 Contador actualizado:', this.contadorNoLeidas);
          }
        },
        error: (error) => {
          console.error('❌ Error al actualizar contador:', error);
        }
      });
  }

  private cargarNotificaciones(): void {
    this.cargando = true;
    this.error = false;

    this.notificacionesService.obtenerTodas(this.limit, this.offset)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log(' Notificaciones recibidas:', response);
          
          if (response.success && response.data) {
            this.notificaciones = response.data.notificaciones || [];
            this.hayMas = this.notificaciones.length >= this.limit;
            console.log('✅ Notificaciones cargadas:', this.notificaciones.length);
          } else {
            this.notificaciones = [];
            this.hayMas = false;
          }
          
          this.cargando = false;
        },
        error: (error) => {
          console.error('Error al cargar notificaciones:', error);
          this.error = true;
          this.cargando = false;
        }
      });
  }

  toggleNotifications(event: MouseEvent): void {
    event.stopPropagation();
    this.showNotifications = !this.showNotifications;
    
    if (this.showNotifications) {
      this.bloquearScrollBody();
      
      if (this.notificaciones.length === 0) {
        this.cargarNotificaciones();
      }
    } else {
      this.restaurarScrollBody();
    }
  }

  marcarComoLeida(notificacion: Notificacion, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }

    if (!notificacion.leida) {
      this.notificacionesService.marcarComoLeida(notificacion.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            notificacion.leida = true;
            this.contadorNoLeidas = Math.max(0, this.contadorNoLeidas - 1);
            console.log('✅ Notificación marcada como leída:', notificacion.id);
          },
          error: (error) => {
            console.error('Error al marcar como leída:', error);
          }
        });
    }
  }

  marcarTodasComoLeidas(): void {
    if (this.contadorNoLeidas === 0) {
      console.log('ℹ️ No hay notificaciones no leídas');
      return;
    }

    this.notificacionesService.marcarTodasComoLeidas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.notificaciones.forEach(n => n.leida = true);
          this.contadorNoLeidas = 0;
          console.log('✅ Todas las notificaciones marcadas como leídas');
          
          if (this.isMobile) {
            this.mostrarFeedback('Todas marcadas como leídas ✓');
          }
        },
        error: (error) => {
          console.error('Error al marcar todas como leídas:', error);
          if (this.isMobile) {
            this.mostrarFeedback('Error al marcar como leídas ✗');
          }
        }
      });
  }

  eliminarNotificacion(notificacionId: number, event: MouseEvent): void {
    event.stopPropagation();

    this.notificacionesService.eliminar(notificacionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          const notif = this.notificaciones.find(n => n.id === notificacionId);
          if (notif && !notif.leida) {
            this.contadorNoLeidas = Math.max(0, this.contadorNoLeidas - 1);
          }
          
          this.notificaciones = this.notificaciones.filter(n => n.id !== notificacionId);
          console.log('✅ Notificación eliminada:', notificacionId);
          
          if (this.isMobile) {
            this.mostrarFeedback('Notificación eliminada ✓');
          }
        },
        error: (error) => {
          console.error(' Error al eliminar notificación:', error);
          if (this.isMobile) {
            this.mostrarFeedback('Error al eliminar ✗');
          }
        }
      });
  }

  manejarClicNotificacion(notificacion: Notificacion): void {
    console.log('👆 Clic en notificación:', notificacion);

    this.marcarComoLeida(notificacion);
    this.cerrarNotificaciones();

    switch (notificacion.tipo) {
      case 'follow':
        this.router.navigate(['/perfil', notificacion.de_usuario_id]);
        break;

      case 'like':
      case 'comment':
        if (notificacion.publicacion_id) {
          this.router.navigate(['/publicacion', notificacion.publicacion_id]);
        }
        break;

      default:
        console.log('Tipo de notificación no manejado:', notificacion.tipo);
    }
  }

  obtenerMensajeCorto(mensaje: string): string {
    if (!mensaje) return '';
    
    if (this.isMobile && mensaje.length > 60) {
      return mensaje.substring(0, 60) + '...';
    }
    
    return mensaje;
  }

  obtenerIconoTipo(tipo: string): string {
    return this.notificacionesService.obtenerIconoTipo(tipo);
  }

  obtenerColorTipo(tipo: string): string {
    return this.notificacionesService.obtenerColorTipo(tipo);
  }

  formatearTiempo(fecha: string): string {
    return this.notificacionesService.formatearTiempo(fecha);
  }

  obtenerAvatar(notificacion: Notificacion): string {
    // Priorizar foto de S3
    if (notificacion.foto_perfil_s3) {
      return notificacion.foto_perfil_s3;
    }
    
    // Si hay URL de foto, usarla directamente
    if (notificacion.foto_perfil_url) {
      if (notificacion.foto_perfil_url.startsWith('http')) {
        return notificacion.foto_perfil_url;
      }
      
      return `${this.apiBaseUrl}${notificacion.foto_perfil_url}`;
    }
    
    // Fallback: generar avatar con las iniciales
    return this.obtenerAvatarFallback(notificacion.nombre_completo);
  }

  obtenerAvatarFallback(nombreCompleto: string): string {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(nombreCompleto)}&background=random&size=100`;
  }

  obtenerIniciales(nombreCompleto: string): string {
    const nombres = nombreCompleto.trim().split(' ');
    if (nombres.length >= 2) {
      return (nombres[0][0] + nombres[1][0]).toUpperCase();
    }
    return nombres[0].substring(0, 2).toUpperCase();
  }

  cerrarNotificaciones(): void {
    this.showNotifications = false;
    this.restaurarScrollBody();
    this.close.emit();
  }

  verTodasLasNotificaciones(): void {
    this.cerrarNotificaciones();
    this.router.navigate(['/notificaciones']);
  }

  private mostrarFeedback(mensaje: string): void {
    console.log('💬 Feedback:', mensaje);
  }

  isLightTheme(): boolean {
    const lightThemes = [
      'default',
      'forest', 
      'sunset',
      'ocean',
      'rose',
      'slate',
      'lavender',
      'candy',
      'chaos'
    ];
    
    return lightThemes.includes(this.currentTheme.id);
  }

  get notificationsCount(): number {
    return this.contadorNoLeidas;
  }

  get hayNotificaciones(): boolean {
    return this.notificaciones.length > 0;
  }

  recargar(): void {
    if (this.cargando) {
      console.log('Ya hay una recarga en progreso');
      return;
    }
    
    this.offset = 0;
    this.cargarNotificaciones();
  }
}