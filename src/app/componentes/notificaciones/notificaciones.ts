import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Notificacion, NotificacionesService } from '../../core/servicios/notificacion/notificacion';
import { AutenticacionService } from '../../core/servicios/autenticacion/autenticacion';
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

  public readonly apiBaseUrl = window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : 'http://3.146.83.30:3000';
  public readonly s3BaseUrl = 'https://redstudent-uploads.s3.us-east-2.amazonaws.com';

  showNotifications = false;
  cargando = false;
  error = false;

  conexionSSE = false;
  intentandoReconectar = false;

  notificaciones: Notificacion[] = [];
  contadorNoLeidas = 0;

  limit = 20;
  offset = 0;
  hayMas = true;

  private destroy$ = new Subject<void>();

  private readonly DIAS_PARA_AUTO_OCULTAR = 30;
  private readonly STORAGE_KEY = 'notificaciones_ocultas';
  private notificacionesOcultas: Set<number> = new Set();

  encodeURIComponent = encodeURIComponent;

  constructor(
    private notificacionesService: NotificacionesService,
    private autenticacionService: AutenticacionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.detectarMobile();
    this.cargarNotificacionesOcultas();
    this.limpiarNotificacionesAntiguas();
    this.actualizarContador();
    this.suscribirseEventosSSE();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.restaurarScrollBody();
  }

  private suscribirseEventosSSE(): void {
    this.notificacionesService.conexionSSE$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (conectado) => {
          this.conexionSSE = conectado;
          
          if (!conectado) {
            this.intentandoReconectar = true;
          } else {
            this.intentandoReconectar = false;
          }
        }
      });

    this.notificacionesService.nuevaNotificacion$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (notificacion) => {
          if (this.notificacionesOcultas.has(notificacion.id)) {
            return;
          }
          
          this.notificaciones.unshift(notificacion);
          
          if (!notificacion.leida) {
            this.contadorNoLeidas++;
          }
          
          this.mostrarFeedbackNuevaNotificacion(notificacion);
        }
      });

    this.notificacionesService.contador$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (total) => {
          this.contadorNoLeidas = total;
        }
      });
  }

  private mostrarFeedbackNuevaNotificacion(notificacion: Notificacion): void {
    this.reproducirSonidoNotificacion();
    
    if (this.showNotifications) {
      this.aplicarAnimacionNuevaNotificacion();
    }
    
   
  }

  private reproducirSonidoNotificacion(): void {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      // Silencioso
    }
  }

  private aplicarAnimacionNuevaNotificacion(): void {
    setTimeout(() => {
      const primeraNotificacion = document.querySelector('.notificaciones .primera-notificacion');
      if (primeraNotificacion) {
        primeraNotificacion.classList.add('animate-pulse');
        setTimeout(() => {
          primeraNotificacion.classList.remove('animate-pulse');
        }, 1000);
      }
    }, 100);
  }


  private cargarNotificacionesOcultas(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.notificacionesOcultas = new Set(data.ids || []);
      }
    } catch (error) {
      this.notificacionesOcultas = new Set();
    }
  }

  private guardarNotificacionesOcultas(): void {
    try {
      const data = {
        ids: Array.from(this.notificacionesOcultas),
        timestamp: Date.now()
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      // Silencioso
    }
  }

  private limpiarNotificacionesAntiguas(): void {
    if (this.notificacionesOcultas.size > 1000) {
      const arrayIds = Array.from(this.notificacionesOcultas);
      this.notificacionesOcultas = new Set(arrayIds.slice(-1000));
      this.guardarNotificacionesOcultas();
    }
  }

  private debeOcultarseAutomaticamente(notificacion: Notificacion): boolean {
    const fechaNotificacion = new Date(notificacion.fecha_creacion);
    const ahora = new Date();
    const diasPasados = (ahora.getTime() - fechaNotificacion.getTime()) / (1000 * 60 * 60 * 24);
    
    return diasPasados > this.DIAS_PARA_AUTO_OCULTAR;
  }

  private filtrarNotificacionesVisibles(notificaciones: Notificacion[]): Notificacion[] {
    return notificaciones.filter(notif => {
      if (this.notificacionesOcultas.has(notif.id)) {
        return false;
      }
      
      if (this.debeOcultarseAutomaticamente(notif)) {
        this.notificacionesOcultas.add(notif.id);
        return false;
      }
      
      return true;
    });
  }

  private detectarMobile(): void {
    this.isMobile = window.innerWidth <= 640;
  }

  @HostListener('window:resize')
  onResize(): void {
    const wasMobile = this.isMobile;
    this.detectarMobile();
    
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

  private actualizarContador(): void {
    this.notificacionesService.contarNoLeidas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.contadorNoLeidas = response.data.total;
          }
        },
        error: (error) => {
          // Silencioso
        }
      });
  }

  private cargarNotificaciones(): void {
    this.cargando = true;
    this.error = false;

    this.cargarNotificacionesOcultas();

    this.notificacionesService.obtenerTodas(this.limit, this.offset)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            const todasLasNotificaciones = response.data.notificaciones || [];
            
            this.notificaciones = this.filtrarNotificacionesVisibles(todasLasNotificaciones);
            
            this.hayMas = this.notificaciones.length >= this.limit;
          } else {
            this.notificaciones = [];
            this.hayMas = false;
          }
          
          this.cargando = false;
        },
        error: (error) => {
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
      
      this.cargarNotificacionesOcultas();
      
      if (this.notificaciones.length === 0) {
        this.cargarNotificaciones();
      } else {
        this.notificaciones = this.filtrarNotificacionesVisibles(this.notificaciones);
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
          },
          error: (error) => {
            // Silencioso
          }
        });
    }
  }

  marcarTodasComoLeidas(): void {
    if (this.contadorNoLeidas === 0) {
      return;
    }

    this.notificacionesService.marcarTodasComoLeidas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.notificaciones.forEach(n => n.leida = true);
          this.contadorNoLeidas = 0;
          
          if (this.isMobile) {
            this.mostrarFeedback('Todas marcadas como leídas ✓');
          }
        },
        error: (error) => {
          if (this.isMobile) {
            this.mostrarFeedback('Error al marcar como leídas ✗');
          }
        }
      });
  }

  borrarTodo(): void {
    if (this.notificaciones.length === 0) {
      return;
    }

    this.notificaciones.forEach(notif => {
      this.notificacionesOcultas.add(notif.id);
    });

    this.guardarNotificacionesOcultas();

    const cantidadBorrada = this.notificaciones.length;
    this.notificaciones = [];
    
    this.actualizarContador();
    
    if (this.isMobile) {
      this.mostrarFeedback('Notificaciones borradas ✓');
    }

    setTimeout(() => {
      this.cerrarNotificaciones();
    }, 500);
  }

  eliminarNotificacion(notificacionId: number, event: MouseEvent): void {
    event.stopPropagation();

    this.notificacionesOcultas.add(notificacionId);
    this.guardarNotificacionesOcultas();

    const notif = this.notificaciones.find(n => n.id === notificacionId);
    if (notif && !notif.leida) {
      this.contadorNoLeidas = Math.max(0, this.contadorNoLeidas - 1);
    }
    
    this.notificaciones = this.notificaciones.filter(n => n.id !== notificacionId);
    
    if (this.isMobile) {
      this.mostrarFeedback('Notificación eliminada ✓');
    }
  }

  manejarClicNotificacion(notificacion: Notificacion): void {
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
        // No hacer nada
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
    if (notificacion.foto_perfil_s3) {
      return this.formatearUrlS3(notificacion.foto_perfil_s3);
    }
    
    if (notificacion.foto_perfil_url) {
      return this.formatearUrlS3(notificacion.foto_perfil_url);
    }
    
    return this.obtenerAvatarFallback(notificacion.nombre_completo);
  }

  private formatearUrlS3(url: string): string {
    if (!url) {
      return '';
    }

    if (url.startsWith('https://redstudent-uploads.s3.us-east-2.amazonaws.com')) {
      return url.replace('/perfil/', '/perfiles/');
    }

    if (url.startsWith('perfiles/')) {
      return `${this.s3BaseUrl}/${url}`;
    }

    if (!url.startsWith('http') && !url.includes('/')) {
      return `${this.s3BaseUrl}/perfiles/${url}`;
    }

    const match = url.match(/\/(perfil|perfiles)\/.+$/);
    if (match) {
      const nombreArchivo = match[0].split('/').pop();
      return `${this.s3BaseUrl}/perfiles/${nombreArchivo}`;
    }

    return url;
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

  private mostrarFeedback(mensaje: string): void {
    // Implementar feedback si es necesario
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
      return;
    }
    
    this.cargarNotificacionesOcultas();
    
    this.offset = 0;
    this.cargarNotificaciones();
  }
}