// sidebar-usuarios-activos.component.ts
import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FotosService } from '../../core/servicios/fotos/fotos';
import { UsuarioService } from '../../core/servicios/usuarios/usuarios';
import { AutenticacionService } from '../../core/servicios/autenticacion/autenticacion';
import { ActividadService } from '../../core/servicios/Actividad/actividad';
import { Subscription } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';
import { Usuario } from '../../core/modelos/usuario.model';
import { environment } from '../../../environments/environment';

interface UsuarioConFoto extends Usuario {
  activo: number;
}

@Component({
  selector: 'app-sidebar-usuarios-activos',
  imports: [CommonModule],
  templateUrl: './sidebar-usuarios-activos.html',
  styleUrl: './sidebar-usuarios-activos.css'
})
export class SidebarUsuariosActivos implements OnInit, OnDestroy {
  @Input() cardBg: string = '';
  @Input() textPrimaryClass: string = '';
  @Input() textSecondaryClass: string = '';
  @Input() accentBg: string = '';
  @Input() hoverBackground: string = '';
  @Input() borderClass: string = '';

  usuariosConFotos: UsuarioConFoto[] = [];
  cargandoFotos: boolean = false;
  estaAutenticado: boolean = false;
  usuarioActualId: number | null = null;

  private subscriptions: Subscription = new Subscription();
  private intervaloActualizacion: any;

  private readonly BASE_URL = environment.socketUrl;

  private readonly AVATAR_COLORS = [
    'linear-gradient(to bottom right, #2dd4bf, #0d9488)',
    'linear-gradient(to bottom right, #f97316, #ea580c)',
    'linear-gradient(to bottom right, #a855f7, #9333ea)',
    'linear-gradient(to bottom right, #ec4899, #db2777)',
    'linear-gradient(to bottom right, #6366f1, #8b5cf6)',
    'linear-gradient(to bottom right, #3b82f6, #2563eb)',
    'linear-gradient(to bottom right, #10b981, #059669)',
    'linear-gradient(to bottom right, #fbbf24, #f59e0b)'
  ];

  constructor(
    private router: Router,
    private fotosService: FotosService,
    private usuarioService: UsuarioService,
    private authService: AutenticacionService,
    private actividadService: ActividadService
  ) {
    console.log('🔧 [SIDEBAR] Constructor ejecutado');
    console.log('🏠 [SIDEBAR] BASE_URL:', this.BASE_URL);
  }

  ngOnInit(): void {
    console.log('🚀 [SIDEBAR] ngOnInit iniciado');

    // Verificar si el usuario está autenticado
    this.subscriptions.add(
      this.authService.currentUser.subscribe(usuario => {
        console.log('👤 [SIDEBAR] Usuario actual:', usuario);

        this.estaAutenticado = !!usuario;
        this.usuarioActualId = usuario?.id || null;

        console.log('🔐 [SIDEBAR] Estado de autenticación:', {
          estaAutenticado: this.estaAutenticado,
          usuarioActualId: this.usuarioActualId,
          nombreUsuario: usuario?.nombre_usuario
        });

        if (this.estaAutenticado) {
          console.log('✅ [SIDEBAR] Usuario autenticado - Cargando seguidores');

          // Cargar seguidores activos
          this.cargarSeguidoresActivos();
          this.iniciarActualizacionPeriodica();
        } else {
          console.log('❌ [SIDEBAR] Usuario NO autenticado');
          this.detenerActualizacionPeriodica();
          this.usuariosConFotos = [];
        }
      })
    );

    // Suscribirse al estado de actividad del usuario actual
    this.subscriptions.add(
      this.actividadService.obtenerEstadoActividad().subscribe(activo => {
        console.log('📊 [SIDEBAR] Estado de actividad:', activo ? 'ACTIVO ✅' : 'INACTIVO ⏰');
      })
    );
  }

  ngOnDestroy(): void {
    console.log('🔚 [SIDEBAR] Componente destruido');
    this.subscriptions.unsubscribe();
    this.detenerActualizacionPeriodica();
  }

  /**
   * ✅ NUEVA: Construir URL local para foto de perfil
   */
  private construirUrlLocal(foto: string | null): string | null {
    if (!foto) return null;

    // Si es URL de localhost o AWS antigua, reescribir
    if (foto.startsWith('http://localhost:3000') || foto.startsWith('http://3.146.83.30:3000')) {
      return foto.replace(/https?:\/\/[^/]+(:[0-9]+)?/, this.BASE_URL);
    }

    // Si es ruta relativa
    if (foto.startsWith('/uploads/')) {
      return `${this.BASE_URL}${foto}`;
    }

    // Si no tiene prefijo, construir
    if (!foto.startsWith('http')) {
      return `${this.BASE_URL}${foto.startsWith('/') ? foto : '/' + foto}`;
    }

    return foto;
  }

  /**
   * ✅ NUEVA: Obtener URL de foto de perfil con validación
   */
  obtenerUrlFotoPerfil(usuario: UsuarioConFoto): string | null {
    const url = this.construirUrlLocal(usuario.foto_perfil_url || null);

    if (url) {
      console.log('🖼️ [SIDEBAR] URL foto construida:', {
        usuario: usuario.nombre_usuario,
        original: usuario.foto_perfil_url,
        construida: url
      });
    }

    return url;
  }

  /**
   * ✅ NUEVA: Verificar si el usuario tiene foto
   */
  tieneFotoPerfil(usuario: UsuarioConFoto): boolean {
    return this.obtenerUrlFotoPerfil(usuario) !== null;
  }

  /**
   * Carga los SEGUIDORES activos del usuario logueado
   */
  private cargarSeguidoresActivos(): void {
    console.log('🔄 [SIDEBAR] Iniciando carga de seguidores activos...');
    console.log('🔄 [SIDEBAR] Usuario ID:', this.usuarioActualId);

    if (!this.estaAutenticado) {
      console.log('⚠️ [SIDEBAR] No está autenticado, abortando carga');
      this.usuariosConFotos = [];
      return;
    }

    this.cargandoFotos = true;

    // Llamar al endpoint
    this.usuarioService.obtenerSeguidoresActivos().subscribe({
      next: (response) => {
        console.log('📥 [SIDEBAR] Respuesta del servidor:', response);

        if (response.success && response.data) {
          const seguidoresActivos = response.data;

          console.log('👥 [SIDEBAR] Seguidores activos encontrados:', {
            cantidad: seguidoresActivos.length,
            usuarios: seguidoresActivos.map((u: any) => ({
              id: u.id,
              nombre: u.nombre_completo,
              activo: u.activo
            }))
          });

          if (seguidoresActivos.length > 0) {
            this.cargarFotosUsuarios(seguidoresActivos);
          } else {
            console.log('⚠️ [SIDEBAR] No hay seguidores activos');
            this.usuariosConFotos = [];
            this.cargandoFotos = false;
          }
        } else {
          console.log('⚠️ [SIDEBAR] Respuesta no exitosa o sin datos');
          this.usuariosConFotos = [];
          this.cargandoFotos = false;
        }
      },
      error: (error) => {
        console.error('❌ [SIDEBAR] Error al cargar seguidores activos:', error);
        console.error('❌ [SIDEBAR] Detalle del error:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          error: error.error
        });
        this.usuariosConFotos = [];
        this.cargandoFotos = false;
      }
    });
  }

  /**
   * Carga las fotos de perfil de los seguidores activos con URLs locales
   */
  private cargarFotosUsuarios(usuarios: any[]): void {
    console.log('📸 [SIDEBAR] Iniciando carga de fotos para:', usuarios.length, 'usuarios');

    const usuariosIds = usuarios.map((u: any) => u.id);
    console.log('📸 [SIDEBAR] IDs a cargar fotos:', usuariosIds);

    this.fotosService.obtenerFotosBatch(usuariosIds).pipe(
      map(response => {
        console.log('📸 [SIDEBAR] Respuesta de fotos:', response);

        if (response.success && response.data) {
          // ✅ Las URLs ya vienen formateadas desde FotosService
          const fotosMap = new Map(
            response.data.map((u: any) => [u.id, u.foto_perfil_url])
          );

          console.log('📸 [SIDEBAR] Mapa de fotos creado:', fotosMap);

          return usuarios.map((usuario: any) => ({
            id: usuario.id,
            nombre_completo: usuario.nombre_completo,
            nombre_usuario: usuario.nombre_usuario,
            foto_perfil_url: fotosMap.get(usuario.id) || null,
            activo: usuario.activo
          }));
        }
        // Sin fotos pero con usuarios
        console.log('⚠️ [SIDEBAR] Sin fotos en respuesta, usando usuarios sin fotos');
        return usuarios.map((u: any) => ({
          id: u.id,
          nombre_completo: u.nombre_completo,
          nombre_usuario: u.nombre_usuario,
          foto_perfil_url: null,
          activo: u.activo
        }));
      }),
      catchError(error => {
        console.error('❌ [SIDEBAR] Error al cargar fotos:', error);
        return of(usuarios.map((u: any) => ({
          id: u.id,
          nombre_completo: u.nombre_completo,
          nombre_usuario: u.nombre_usuario,
          foto_perfil_url: null,
          activo: u.activo
        })));
      })
    ).subscribe({
      next: (usuariosConFotos) => {
        console.log('✅ [SIDEBAR] Usuarios finales con fotos:', usuariosConFotos);
        this.usuariosConFotos = usuariosConFotos;
        this.cargandoFotos = false;
      },
      error: (error) => {
        console.error('❌ [SIDEBAR] Error final:', error);
        this.cargandoFotos = false;
      }
    });
  }

  /**
   * Inicia la actualización periódica cada 30 segundos
   */
  private iniciarActualizacionPeriodica(): void {
    if (this.intervaloActualizacion) {
      console.log('⚠️ [SIDEBAR] Intervalo ya existe, no se crea uno nuevo');
      return;
    }

    console.log('⏰ [SIDEBAR] Iniciando actualización periódica cada 30 segundos');

    this.intervaloActualizacion = setInterval(() => {
      console.log('🔄 [SIDEBAR] Actualización periódica ejecutándose...');
      if (this.estaAutenticado) {
        this.cargarSeguidoresActivos();
      }
    }, 30000); // 30 segundos
  }

  /**
   * Detiene la actualización periódica
   */
  private detenerActualizacionPeriodica(): void {
    if (this.intervaloActualizacion) {
      console.log('⏹️ [SIDEBAR] Deteniendo actualización periódica');
      clearInterval(this.intervaloActualizacion);
      this.intervaloActualizacion = null;
    }
  }

  obtenerIniciales(nombre: string): string {
    if (!nombre) return 'U';
    const palabras = nombre.trim().split(' ');
    return palabras.length >= 2
      ? (palabras[0][0] + palabras[1][0]).toUpperCase()
      : nombre.substring(0, 2).toUpperCase();
  }

  generarColorAvatar(id: number): string {
    return this.AVATAR_COLORS[id % this.AVATAR_COLORS.length];
  }

  irAPerfil(usuarioId: number): void {
    console.log('👉 [SIDEBAR] Navegando al perfil:', usuarioId);
    this.router.navigate(['/perfil', usuarioId]);
  }

  /**
   * ✅ NUEVA: Manejar error de carga de imagen
   */
  onImageError(event: Event, usuario: UsuarioConFoto): void {
    console.warn('⚠️ [SIDEBAR] Error al cargar foto de:', usuario.nombre_usuario);
    // La plantilla HTML mostrará las iniciales automáticamente
  }
}
