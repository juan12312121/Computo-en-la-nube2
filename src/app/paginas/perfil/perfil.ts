import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { DocumentosLista } from '../../componentes/documentos-lista/documentos-lista';
import { FotosPerfil } from '../../componentes/fotos-perfil/fotos-perfil';
import { ModalCambiarBanner } from '../../componentes/modal-cambiar-banner/modal-cambiar-banner';
import { FormularioEditarPerfil, ModalEditarPerfil } from '../../componentes/modal-editar-perfil/modal-editar-perfil';
import { ModalReporte } from '../../componentes/modal-reporte/modal-reporte';
import { ModalSeguidores, TipoModal } from '../../componentes/modal-seguidores/modal-seguidores';
import { Navbar } from '../../componentes/navbar/navbar';
import { ProfileErrorComponent } from '../../componentes/profile-error/profile-error';
import { ProfileHeaderComponent, UsuarioPerfil } from '../../componentes/profile-header/profile-header';
import { ProfileLoadingComponent } from '../../componentes/profile-loading/profile-loading';
import { ProfileTabsComponent, TabType } from '../../componentes/profile-tabs/profile-tabs';
import { PublicacionesPerfil } from '../../componentes/publicaciones-perfil/publicaciones-perfil';
import { SeccionesGrid, Section } from '../../componentes/secciones-grid/secciones-grid';
import { AutenticacionService, Usuario } from '../../core/servicios/autenticacion/autenticacion';
import { Publicacion, PublicacionesService } from '../../core/servicios/publicaciones/publicaciones';
import { ReportesService } from '../../core/servicios/reportes/reportes';
import { SeccionesService, Section as ServiceSection } from '../../core/servicios/secciones/secciones';
import { SeguidorService } from '../../core/servicios/seguidores/seguidores';
import { Theme, ThemeService } from '../../core/servicios/temas';
import { UsuarioService } from '../../core/servicios/usuarios/usuarios';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [
    CommonModule,
    Navbar,
    ProfileLoadingComponent,
    ProfileErrorComponent,
    ProfileHeaderComponent,
    ProfileTabsComponent,
    PublicacionesPerfil,
    ModalEditarPerfil,
    ModalCambiarBanner,
    ModalReporte,
    FotosPerfil,
    DocumentosLista,
    SeccionesGrid,
    ModalSeguidores,
  ],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css'
})
export class Perfil implements OnInit, OnDestroy {
  @ViewChild(FotosPerfil) fotosComponent?: FotosPerfil;

  private readonly apiBaseUrl = this.getBaseUrl('api');
  private readonly s3BaseUrl = this.getBaseUrl('s3');

  usuario: UsuarioPerfil | null = null;
  usuarioActual: Usuario | null = null;
  currentTheme: Theme;
  
  // Estados de carga
  cargandoPerfil = true;
  cargandoPublicaciones = true;
  cargandoSeguir = false;
  cargandoSecciones = false;
  guardandoPerfil = false;
  guardandoBanner = false;

  // Estados de error
  errorCarga = false;
  errorGuardado = false;
  errorBanner = '';
  mensajeError = '';
  
  // UI
  isOwnProfile = true;
  activeTab: TabType = 'todo';
  showEditModal = false;
  showBannerModal = false;
  showSeguidoresModal = false;
  tipoModalSeguidores: TipoModal = 'seguidores';
  estaSiguiendo = false;
  
  // Datos para visibilidad
  publicacionesReales: Publicacion[] = [];
  publicacionesFiltradas: Publicacion[] = [];
  seguidosIds: number[] = [];
  
  sections: Section[] = [];
  
  // Estados para reportes
  showReporteModal = false;
  reportePublicacionId: number | null = null;
  reporteMotivo = '';
  reporteDescripcion = '';
  reporteLoading = false;
  reporteSuccess = false;
  reporteError = '';
  motivosValidos: string[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private themeService: ThemeService,
    private usuarioService: UsuarioService,
    private publicacionesService: PublicacionesService,
    private authService: AutenticacionService,
    private seguidorService: SeguidorService,
    private seccionesService: SeccionesService,
    private route: ActivatedRoute,
    private reportesService: ReportesService
  ) {
    this.currentTheme = this.themeService.getCurrentTheme();
    this.motivosValidos = this.reportesService.obtenerMotivosValidos();
  }

  ngOnInit() {
    this.themeService.currentTheme$
      .pipe(takeUntil(this.destroy$))
      .subscribe(theme => this.currentTheme = theme);

    this.usuarioActual = this.authService.currentUserValue;

    if (this.usuarioActual) {
      this.cargarSeguidos();
    }

    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const userId = params['id'];
        userId ? this.cargarPerfilUsuario(Number(userId)) : this.cargarMiPerfil();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private getBaseUrl(tipo: 'api' | 's3' = 'api'): string {
    const host = window.location.hostname;
    const apiBase = (host === 'localhost' || host === '127.0.0.1')
      ? 'http://localhost:3000'
      : 'http://3.146.83.30:3000';
    const s3Base = 'https://redstudent-uploads.s3.us-east-2.amazonaws.com';
    return tipo === 's3' ? s3Base : apiBase;
  }

  public formatImageUrl(url: string | undefined | null): string | null {
    if (!url) return null;
    
    if (url.includes('s3.us-east-2.amazonaws.com') || url.includes('s3.amazonaws.com')) {
      return url;
    }
    
    if (url.startsWith('http://') || url.startsWith('https://')) {
      const match = url.match(/\/uploads\/.+$/);
      if (match) {
        const rutaLimpia = match[0].replace('/uploads/', '');
        return `${this.s3BaseUrl}/${rutaLimpia}`;
      }
    }
    
    if (!url.includes('/') && !url.startsWith('uploads')) {
      let carpeta = 'publicaciones';
      
      if (url.startsWith('foto_perfil-') || url.includes('perfil')) {
        carpeta = 'perfiles';
      } else if (url.startsWith('foto_portada-') || url.includes('portada')) {
        carpeta = 'portadas';
      }
      
      return `${this.s3BaseUrl}/${carpeta}/${url}`;
    }
    
    const cleanPath = url.replace(/^\/+/, '');
    return `${this.s3BaseUrl}/${cleanPath}`;
  }
  
  public getS3BaseUrl(): string {
    return this.s3BaseUrl;
  }

  getProfileImage(): string | null {
    return this.formatImageUrl(this.usuario?.foto_perfil_url);
  }

  getCoverImage(): string | null {
    return this.formatImageUrl(this.usuario?.foto_portada_url);
  }

  private resetEstados(): void {
    this.cargandoPerfil = true;
    this.cargandoPublicaciones = true;
    this.errorCarga = false;
  }

  private cargarSeguidos(): void {
    if (!this.usuarioActual) {
      return;
    }

    this.seguidorService.listarSeguidos(this.usuarioActual.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data?.seguidos) {
            this.seguidosIds = response.data.seguidos.map((s: any) => s.id);
            
            if (this.publicacionesReales.length > 0) {
              this.filtrarPorVisibilidad();
            }
          }
        },
        error: (error) => {
          this.seguidosIds = [];
        }
      });
  }

  cargarMiPerfil(): void {
    this.resetEstados();
    this.isOwnProfile = true;

    this.usuarioService.obtenerMiPerfil()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (responsePerfil) => {
          if (responsePerfil.success && responsePerfil.data) {
            this.usuario = responsePerfil.data;
            if (this.usuario && this.usuarioActual) {
              this.cargarContadores(this.usuarioActual.id);
            }
            this.cargandoPerfil = false;
            this.cargarPublicaciones();
            this.cargarSecciones();
          } else {
            this.handleError();
          }
        },
        error: () => this.handleError()
      });
  }

  cargarPerfilUsuario(userId: number): void {
    this.resetEstados();
    this.isOwnProfile = this.usuarioActual?.id === userId;

    this.usuarioService.obtenerPerfil(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (responsePerfil) => {
          if (responsePerfil.success && responsePerfil.data) {
            this.usuario = responsePerfil.data;
            this.cargarContadores(userId);
            this.cargandoPerfil = false;
            
            this.cargarPublicacionesUsuario(userId);
            this.cargarSecciones();
            
            if (!this.isOwnProfile && this.usuarioActual) {
              this.verificarSeguimiento();
            }
          } else {
            this.handleError();
          }
        },
        error: () => this.handleError()
      });
  }

private cargarSecciones(): void {
  if (!this.usuario) return;
  
  this.cargandoSecciones = true;
  
  // Si es tu perfil, obtener tus secciones. Si es otro usuario, obtener las suyas
  const llamada = this.isOwnProfile 
    ? this.seccionesService.obtenerSecciones()
    : this.seccionesService.obtenerSeccionesUsuario(this.usuario.id);

  llamada
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (secciones: ServiceSection[]) => {
        this.sections = secciones.map(s => ({
          id: s.id,
          nombre: s.nombre,
          icono: s.icono,
          color: s.color,
          total_posts: s.total_posts,
          usuario_id: s.usuario_id,
          fecha_creacion: s.fecha_creacion
        }));
        this.cargandoSecciones = false;
      },
      error: (error) => {
        console.error('Error cargando secciones:', error);
        this.sections = [];
        this.cargandoSecciones = false;
      }
    });
}

  recargarSecciones(): void {
    this.cargarSecciones();
  }

  private handleError(): void {
    this.errorCarga = true;
    this.cargandoPerfil = false;
    this.cargandoPublicaciones = false;
  }

  private cargarPublicaciones(): void {
    this.publicacionesService.obtenerMisPublicaciones()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => this.procesarPublicaciones(response),
        error: () => this.procesarPublicacionesError()
      });
  }

  private cargarPublicacionesUsuario(userId: number): void {
    this.publicacionesService.obtenerPublicacionesUsuario(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => this.procesarPublicaciones(response),
        error: () => this.procesarPublicacionesError()
      });
  }

  private procesarPublicaciones(response: any): void {
    this.publicacionesReales = response.success && response.data ? response.data : [];
    this.filtrarPorVisibilidad();
    this.cargandoPublicaciones = false;
  }

  private procesarPublicacionesError(): void {
    this.publicacionesReales = [];
    this.publicacionesFiltradas = [];
    this.cargandoPublicaciones = false;
  }

  private filtrarPorVisibilidad(): void {
    if (!this.usuarioActual) {
      this.publicacionesFiltradas = this.publicacionesReales.filter(
        p => !p.visibilidad || p.visibilidad === 'publico'
      );
      return;
    }

    this.publicacionesFiltradas = this.publicacionesReales.filter(post => {
      const visibilidad = post.visibilidad || 'publico';
      const esAutor = post.usuario_id === this.usuarioActual!.id;

      if (esAutor) return true;
      if (visibilidad === 'publico') return true;
      if (visibilidad === 'seguidores') {
        return this.seguidosIds.includes(post.usuario_id);
      }

      return false;
    });
  }

  reintentarCarga(): void {
    const userId = this.route.snapshot.params['id'];
    userId ? this.cargarPerfilUsuario(Number(userId)) : this.cargarMiPerfil();
  }

  private cargarContadores(userId: number): void {
    this.seguidorService.listarSeguidores(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (this.usuario && response.success && response.data) {
            this.usuario.total_seguidores = response.data.total || 0;
          }
        },
        error: (error) => {
          if (this.usuario && !this.usuario.total_seguidores) {
            this.usuario.total_seguidores = 0;
          }
        }
      });

    this.seguidorService.listarSeguidos(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (this.usuario && response.success && response.data) {
            this.usuario.total_siguiendo = response.data.total || 0;
          }
        },
        error: (error) => {
          if (this.usuario && !this.usuario.total_siguiendo) {
            this.usuario.total_siguiendo = 0;
          }
        }
      });
  }

  private verificarSeguimiento(): void {
    if (!this.usuarioActual || !this.usuario) return;

    this.seguidorService.verificar(this.usuario.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.estaSiguiendo = response.data.following || false;
          }
        },
        error: (error) => {
          this.estaSiguiendo = false;
        }
      });
  }

  toggleSeguir(): void {
    if (!this.usuarioActual) {
      alert('Debes iniciar sesión para seguir usuarios');
      return;
    }

    if (!this.usuario || this.isOwnProfile || this.cargandoSeguir) return;

    this.cargandoSeguir = true;

    this.seguidorService.toggle(this.usuario.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            const nuevoEstado = response.data.following ?? false;
            this.estaSiguiendo = nuevoEstado;
            
            if (this.usuario) {
              const cambio = nuevoEstado ? 1 : -1;
              this.usuario.total_seguidores = Math.max(
                0, 
                (this.usuario.total_seguidores || 0) + cambio
              );
            }

            if (this.usuario) {
              if (nuevoEstado) {
                this.seguidosIds.push(this.usuario.id);
              } else {
                this.seguidosIds = this.seguidosIds.filter(id => id !== this.usuario!.id);
              }
              this.filtrarPorVisibilidad();
            }
          } else {
            alert('Error al procesar la solicitud');
          }
          
          this.cargandoSeguir = false;
        },
        error: (error) => {
          const mensajeError = this.getMensajeError(error);
          alert(mensajeError);
          this.cargandoSeguir = false;
        }
      });
  }

  private getMensajeError(error: any): string {
    if (error.status === 401) return 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente';
    if (error.status === 404) return 'Usuario no encontrado';
    return error.error?.mensaje || 'Error al procesar la solicitud de seguimiento';
  }

  abrirSeguidores(): void {
    this.tipoModalSeguidores = 'seguidores';
    this.toggleBodyOverflow(true);
    this.showSeguidoresModal = true;
  }

  abrirSiguiendo(): void {
    this.tipoModalSeguidores = 'seguidos';
    this.toggleBodyOverflow(true);
    this.showSeguidoresModal = true;
  }

  cerrarModalSeguidores(): void {
    this.showSeguidoresModal = false;
    this.toggleBodyOverflow(false);
  }

  private toggleBodyOverflow(hidden: boolean): void {
    document.body.style.overflow = hidden ? 'hidden' : 'auto';
  }

  getInitials(): string {
    if (!this.usuario) return '??';
    const names = this.usuario.nombre_completo.trim().split(' ');
    return names.length >= 2 
      ? (names[0][0] + names[1][0]).toUpperCase()
      : names[0].substring(0, 2).toUpperCase();
  }

  toggleProfileMode(): void {
    this.isOwnProfile ? this.abrirModalEdicion() : this.toggleSeguir();
  }

  getButtonText(): string {
    if (this.isOwnProfile) return 'Editar perfil';
    return this.cargandoSeguir ? 'Cargando...' : (this.estaSiguiendo ? 'Siguiendo' : 'Seguir');
  }

  getButtonIcon(): string {
    if (this.isOwnProfile) return 'fas fa-edit';
    return this.estaSiguiendo ? 'fas fa-user-check' : 'fas fa-user-plus';
  }

  abrirModalEdicion(): void {
    this.showEditModal = true;
    this.errorGuardado = false;
    this.toggleBodyOverflow(true);
  }

  cerrarModalEdicion(): void {
    this.showEditModal = false;
    this.guardandoPerfil = false;
    this.errorGuardado = false;
    this.mensajeError = '';
    this.toggleBodyOverflow(false);
  }

  guardarPerfil(data: {formulario: FormularioEditarPerfil, archivo: File | null}): void {
    if (!this.usuario) return;

    this.guardandoPerfil = true;
    this.errorGuardado = false;

    const formData = this.construirFormData(data);
    
    if (!formData.has('nombre_completo') && !formData.has('biografia') && !formData.has('ubicacion') && !formData.has('carrera') && !formData.has('foto_perfil')) {
      this.cerrarModalEdicion();
      return;
    }

    this.usuarioService.actualizarPerfil(formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.usuario = { ...this.usuario, ...response.data };
            this.guardandoPerfil = false;
            this.cerrarModalEdicion();
            
            this.fotosComponent?.recargarFotos();
          }
        },
        error: (error) => {
          this.errorGuardado = true;
          this.mensajeError = error.error?.mensaje || 'Error al actualizar el perfil';
          this.guardandoPerfil = false;
        }
      });
  }

  private construirFormData(data: {formulario: FormularioEditarPerfil, archivo: File | null}): FormData {
    const formData = new FormData();
    const campos = ['nombre_completo', 'biografia', 'ubicacion', 'carrera'] as const;

    campos.forEach(campo => {
      if (data.formulario[campo] !== (this.usuario?.[campo] || '')) {
        formData.append(campo, data.formulario[campo]);
      }
    });

    if (data.archivo) formData.append('foto_perfil', data.archivo);
    return formData;
  }

  abrirModalCambiarBanner(): void {
    this.showBannerModal = true;
    this.errorBanner = '';
    this.toggleBodyOverflow(true);
  }

  cerrarModalBanner(): void {
    this.showBannerModal = false;
    this.guardandoBanner = false;
    this.errorBanner = '';
    this.toggleBodyOverflow(false);
  }

  guardarBanner(archivo: File): void {
    this.actualizarBanner(archivo);
  }

  eliminarBanner(): void {
    const formData = new FormData();
    formData.append('foto_portada', '');
    this.actualizarBanner(formData);
  }

  private actualizarBanner(archivoOFormData: File | FormData): void {
    this.guardandoBanner = true;
    this.errorBanner = '';

    const formData = archivoOFormData instanceof FormData ? archivoOFormData : new FormData();
    if (archivoOFormData instanceof File) {
      formData.append('foto_portada', archivoOFormData);
    }

    this.usuarioService.actualizarPerfil(formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.usuario = { ...this.usuario, ...response.data };
            this.guardandoBanner = false;
            this.cerrarModalBanner();
            
            this.fotosComponent?.recargarFotos();
          }
        },
        error: (error) => {
          this.errorBanner = error.error?.mensaje || 'Error al actualizar la portada';
          this.guardandoBanner = false;
        }
      });
  }

  switchTab(tab: TabType): void {
    this.activeTab = tab;
  }

  onSectionSelected(sectionId: number): void {
    // Implementar navegación a sección
  }

  onDocumentDownload(docId: number): void {
    // Implementar descarga de documento
  }

  onLikeToggled(postId: number): void {
    // Manejar like toggle
  }

  onCommentAdded(data: {postId: number, comment: string}): void {
    this.mostrarNotificacion('Comentario publicado correctamente', 'success');
  }

  onPostShared(data: {postId: number, platform: string}): void {
    this.mostrarNotificacion(`Publicación compartida en ${data.platform}`, 'success');
  }

  private mostrarNotificacion(mensaje: string, tipo: 'success' | 'error' | 'info' = 'info'): void {
    // Implementar sistema de notificaciones
  }

  openCreateModal(): void {
    // Implementar modal de creación
  }

  // ============================================
  // MÉTODOS PARA REPORTES
  // ============================================

  /**
   * Abrir modal de reporte para una publicación
   */
  abrirModalReporte(publicacionId: number): void {
    this.reportePublicacionId = publicacionId;
    this.reporteMotivo = '';
    this.reporteDescripcion = '';
    this.reporteError = '';
    this.reporteSuccess = false;
    this.showReporteModal = true;
    this.toggleBodyOverflow(true);
  }

  /**
   * Cerrar modal de reporte
   */
  cerrarModalReporte(): void {
    this.showReporteModal = false;
    this.reportePublicacionId = null;
    this.reporteMotivo = '';
    this.reporteDescripcion = '';
    this.reporteError = '';
    this.reporteSuccess = false;
    this.reporteLoading = false;
    this.toggleBodyOverflow(false);
  }

  /**
   * Enviar reporte de publicación
   */
  enviarReporte(): void {
    if (!this.reportePublicacionId || !this.reporteMotivo) {
      this.reporteError = 'Debes seleccionar un motivo';
      return;
    }

    this.reporteLoading = true;
    this.reporteError = '';

    this.reportesService.crearReporte({
      publicacionId: this.reportePublicacionId,
      motivo: this.reporteMotivo,
      descripcion: this.reporteDescripcion || null as any
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.reporteSuccess = true;
          this.reporteLoading = false;

          // Si la publicación fue eliminada (5+ reportes)
          if (response.data.totalReportes >= 5) {
            // Remover la publicación del array local
            this.publicacionesReales = this.publicacionesReales.filter(
              p => p.id !== this.reportePublicacionId
            );
            this.filtrarPorVisibilidad();

            setTimeout(() => {
              alert('⚠️ Esta publicación ha sido eliminada por exceso de reportes');
              this.cerrarModalReporte();
            }, 1500);
          } else {
            // Cerrar modal después de 2 segundos
            setTimeout(() => {
              this.cerrarModalReporte();
            }, 2000);
          }
        },
        error: (error) => {
          this.reporteLoading = false;
          
          if (error.mensaje === 'Ya has reportado esta publicación') {
            this.reporteError = 'Ya has reportado esta publicación anteriormente';
          } else {
            this.reporteError = error.mensaje || 'Error al enviar el reporte. Intenta nuevamente.';
          }
        }
      });
  }

  /**
   * Actualizar motivo del reporte
   */
  onMotivoChange(motivo: string): void {
    this.reporteMotivo = motivo;
    this.reporteError = '';
  }

  /**
   * Actualizar descripción del reporte
   */
  onDescripcionChange(descripcion: string): void {
    this.reporteDescripcion = descripcion;
  }
}