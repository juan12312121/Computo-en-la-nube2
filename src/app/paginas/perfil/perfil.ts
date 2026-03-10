import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewChild, signal, computed, inject } from '@angular/core';
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
import { SeccionesGrid } from '../../componentes/secciones-grid/secciones-grid';
import { Usuario } from '../../core/modelos/usuario.model';
import { AutenticacionService } from '../../core/servicios/autenticacion/autenticacion';
import { Publicacion } from '../../core/modelos/publicacion.model';
import { PublicacionesService } from '../../core/servicios/publicaciones/publicaciones';
import { ReportesService } from '../../core/servicios/reportes/reportes';
import { SeccionesService } from '../../core/servicios/secciones/secciones';
import { Section } from '../../core/modelos/seccion.model';
import { SeguidorService } from '../../core/servicios/seguidores/seguidores';
import { Theme, ThemeService } from '../../core/servicios/temas';
import { UsuarioService } from '../../core/servicios/usuarios/usuarios';
import { SocketService } from '../../core/servicios/socket/socket';
import * as Utils from '../../core/utilidades/formateadores';
import { ChatService } from '../../core/servicios/chat/chat';
import { environment } from '../../../environments/environment';

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
  styleUrl: './perfil.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Perfil implements OnInit, OnDestroy {
  @ViewChild(FotosPerfil) fotosComponent?: FotosPerfil;

  public readonly apiBaseUrl = environment.socketUrl;

  // Signals para estado fundamental
  usuario = signal<UsuarioPerfil | null>(null);
  usuarioActual = signal<Usuario | null>(null);
  currentTheme = signal<Theme>({ id: 'default' } as Theme);

  // Estados de carga
  cargandoPerfil = signal(true);
  cargandoPublicaciones = signal(true);
  cargandoSeguir = signal(false);
  cargandoSecciones = signal(false);
  guardandoPerfil = signal(false);
  guardandoBanner = signal(false);

  // Estados de error
  errorCarga = signal(false);
  errorGuardado = signal(false);
  errorBanner = signal('');
  mensajeError = signal('');

  // UI
  isOwnProfile = signal(true);
  activeTab = signal<TabType>('todo');
  showEditModal = signal(false);
  showBannerModal = signal(false);
  showSeguidoresModal = signal(false);
  tipoModalSeguidores = signal<TipoModal>('seguidores');
  estaSiguiendo = signal(false);

  // Datos
  publicacionesReales = signal<Publicacion[]>([]);
  seguidosIds = signal<number[]>([]);
  publicacionesFiltradas = computed(() => {
    const list = this.publicacionesReales();
    const curr = this.usuarioActual();
    const followed = this.seguidosIds();

    if (!curr) return list.filter(p => !p.visibilidad || p.visibilidad === 'publico');

    return list.filter(post => {
      const v = post.visibilidad || 'publico';
      if (post.usuario_id === curr.id) return true;
      if (v === 'publico') return true;
      if (v === 'seguidores') return followed.includes(post.usuario_id);
      return false;
    });
  });

  sections = signal<Section[]>([]);

  // Reportes
  showReporteModal = signal(false);
  reportePublicacionId = signal<number | null>(null);
  reporteMotivo = signal('');
  reporteDescripcion = signal('');
  reporteLoading = signal(false);
  reporteSuccess = signal(false);
  reporteError = signal('');
  motivosValidos = signal<string[]>([]);

  private destroy$ = new Subject<void>();

  private themeService = inject(ThemeService);
  private usuarioService = inject(UsuarioService);
  private publicacionesService = inject(PublicacionesService);
  private authService = inject(AutenticacionService);
  private seguidorService = inject(SeguidorService);
  private seccionesService = inject(SeccionesService);
  private route = inject(ActivatedRoute);
  private reportesService = inject(ReportesService);
  private socketService = inject(SocketService);
  private chatService = inject(ChatService);

  ngOnInit() {
    this.currentTheme.set(this.themeService.getCurrentTheme());
    this.motivosValidos.set(this.reportesService.obtenerMotivosValidos());

    this.themeService.currentTheme$
      .pipe(takeUntil(this.destroy$))
      .subscribe(theme => this.currentTheme.set(theme));

    this.usuarioActual.set(this.authService.currentUserValue);

    if (this.usuarioActual()) {
      this.cargarSeguidos();
    }

    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const userId = params['id'];
        userId ? this.cargarPerfilUsuario(Number(userId)) : this.cargarMiPerfil();
      });

    this.setupSocketListeners();
  }

  private setupSocketListeners(): void {
    // Escuchar actualizaciones de likes
    this.socketService.onEvent<{ publicacion_id: number, total: number }>('like_update')
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.publicacionesReales.update(list => list.map(p => {
          if (p.id === data.publicacion_id) {
            return { ...p, total_likes: data.total, likes: data.total };
          }
          return p;
        }));
      });

    // Escuchar nuevos comentarios
    this.socketService.onEvent<{ publicacion_id: number }>('new_comment')
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.publicacionesReales.update(list => list.map(p => {
          if (p.id === data.publicacion_id) {
            return {
              ...p,
              total_comentarios: (p.total_comentarios || 0) + 1,
              comentarios: (p.comentarios || 0) + 1
            };
          }
          return p;
        }));
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getProfileImage(): string | null {
    return Utils.normalizarUrlImagen(this.usuario()?.foto_perfil_url || '', this.apiBaseUrl);
  }

  getCoverImage(): string | null {
    return Utils.normalizarUrlImagen(this.usuario()?.foto_portada_url || '', this.apiBaseUrl);
  }

  private resetEstados(): void {
    this.cargandoPerfil.set(true);
    this.cargandoPublicaciones.set(true);
    this.errorCarga.set(false);
  }

  private cargarSeguidos(): void {
    const user = this.usuarioActual();
    if (!user) return;

    this.seguidorService.listarSeguidos(user.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success && res.data?.seguidos) {
            this.seguidosIds.set(res.data.seguidos.map((s: any) => s.id));
          }
        }
      });
  }

  cargarMiPerfil(): void {
    this.resetEstados();
    this.isOwnProfile.set(true);

    this.usuarioService.obtenerMiPerfil()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.usuario.set(res.data);
            this.cargarContadores(res.data.id);
            this.cargandoPerfil.set(false);
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
    this.isOwnProfile.set(this.usuarioActual()?.id === userId);

    this.usuarioService.obtenerPerfil(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.usuario.set(res.data);
            this.cargarContadores(userId);
            this.cargandoPerfil.set(false);
            this.cargarPublicacionesUsuario(userId);
            this.cargarSecciones();

            if (!this.isOwnProfile() && this.usuarioActual()) {
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
    const user = this.usuario();
    if (!user) return;

    this.cargandoSecciones.set(true);
    const apiCall = this.isOwnProfile()
      ? this.seccionesService.obtenerSecciones()
      : this.seccionesService.obtenerSeccionesUsuario(user.id);

    apiCall.pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any[]) => {
        this.sections.set(res);
        this.cargandoSecciones.set(false);
      },
      error: () => this.cargandoSecciones.set(false)
    });
  }

  private handleError(): void {
    this.errorCarga.set(true);
    this.cargandoPerfil.set(false);
    this.cargandoPublicaciones.set(false);
  }

  private cargarPublicaciones(): void {
    this.publicacionesService.obtenerMisPublicaciones()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => this.procesarPublicaciones(res),
        error: () => this.procesarPublicacionesError()
      });
  }

  private cargarPublicacionesUsuario(userId: number): void {
    this.publicacionesService.obtenerPublicacionesUsuario(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => this.procesarPublicaciones(res),
        error: () => this.procesarPublicacionesError()
      });
  }

  private procesarPublicaciones(res: any): void {
    if (res.success && res.data) {
      const posts = res.data.map((p: any) => ({
        ...p,
        liked: !!(p.usuario_dio_like || p.liked)
      }));
      this.publicacionesReales.set(posts);
    } else {
      this.publicacionesReales.set([]);
    }
    this.cargandoPublicaciones.set(false);
  }

  private procesarPublicacionesError(): void {
    this.publicacionesReales.set([]);
    this.cargandoPublicaciones.set(false);
  }

  private cargarContadores(userId: number): void {
    this.seguidorService.listarSeguidores(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(res => {
        if (res.success && this.usuario()) {
          this.usuario.update(u => u ? { ...u, total_seguidores: res.data.total || 0 } : null);
        }
      });

    this.seguidorService.listarSeguidos(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(res => {
        if (res.success && this.usuario()) {
          this.usuario.update(u => u ? { ...u, total_siguiendo: res.data.total || 0 } : null);
        }
      });
  }

  private verificarSeguimiento(): void {
    const user = this.usuario();
    if (!this.usuarioActual() || !user) return;

    this.seguidorService.verificar(user.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(res => {
        if (res.success && res.data) {
          this.estaSiguiendo.set(res.data.following || false);
        }
      });
  }

  toggleSeguir(): void {
    if (!this.usuarioActual()) return alert('Inicia sesión para seguir');
    const target = this.usuario();
    if (!target || this.isOwnProfile() || this.cargandoSeguir()) return;

    this.cargandoSeguir.set(true);
    this.seguidorService.toggle(target.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.cargandoSeguir.set(false);
          if (res.success && res.data) {
            const following = res.data.following ?? false;
            this.estaSiguiendo.set(following);
            this.usuario.update(u => u ? { ...u, total_seguidores: Math.max(0, (u.total_seguidores || 0) + (following ? 1 : -1)) } : null);

            if (following) this.seguidosIds.update(ids => [...ids, target.id]);
            else this.seguidosIds.update(ids => ids.filter(id => id !== target.id));
          }
        },
        error: () => this.cargandoSeguir.set(false)
      });
  }

  abrirSeguidores(): void {
    this.tipoModalSeguidores.set('seguidores');
    this.showSeguidoresModal.set(true);
    this.toggleBodyOverflow(true);
  }

  abrirSiguiendo(): void {
    this.tipoModalSeguidores.set('seguidos');
    this.showSeguidoresModal.set(true);
    this.toggleBodyOverflow(true);
  }

  cerrarModalSeguidores(): void {
    this.showSeguidoresModal.set(false);
    this.toggleBodyOverflow(false);
  }

  private toggleBodyOverflow(hidden: boolean): void {
    document.body.style.overflow = hidden ? 'hidden' : 'auto';
  }

  getInitials(): string {
    return Utils.obtenerIniciales(this.usuario()?.nombre_completo || '??');
  }

  toggleProfileMode(): void {
    this.isOwnProfile() ? this.abrirModalEdicion() : this.toggleSeguir();
  }

  getButtonText(): string {
    if (this.isOwnProfile()) return 'Editar perfil';
    return this.cargandoSeguir() ? 'Cargando...' : (this.estaSiguiendo() ? 'Siguiendo' : 'Seguir');
  }

  getButtonIcon(): string {
    if (this.isOwnProfile()) return 'fas fa-edit';
    return this.estaSiguiendo() ? 'fas fa-user-check' : 'fas fa-user-plus';
  }

  abrirModalEdicion(): void {
    this.showEditModal.set(true);
    this.toggleBodyOverflow(true);
  }

  cerrarModalEdicion(): void {
    this.showEditModal.set(false);
    this.toggleBodyOverflow(false);
  }

  guardarPerfil(data: { formulario: FormularioEditarPerfil, archivo: File | null }): void {
    const user = this.usuario();
    if (!user) return;

    this.guardandoPerfil.set(true);
    const formData = new FormData();
    const fields = ['nombre_completo', 'biografia', 'ubicacion', 'carrera'] as const;

    fields.forEach(f => {
      if (data.formulario[f] !== (user[f] || '')) formData.append(f, data.formulario[f]);
    });

    if (data.archivo) formData.append('foto_perfil', data.archivo);

    this.usuarioService.actualizarPerfil(formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.usuario.update(u => u ? { ...u, ...res.data } : null);
            this.cerrarModalEdicion();
            this.fotosComponent?.recargarFotos();
          }
          this.guardandoPerfil.set(false);
        },
        error: (err) => {
          this.mensajeError.set(err.error?.mensaje || 'Error al actualizar');
          this.guardandoPerfil.set(false);
        }
      });
  }

  abrirModalCambiarBanner(): void {
    this.showBannerModal.set(true);
    this.toggleBodyOverflow(true);
  }

  cerrarModalBanner(): void {
    this.showBannerModal.set(false);
    this.toggleBodyOverflow(false);
  }

  guardarBanner(archivo: File): void {
    this.actualizarBanner(archivo);
  }

  eliminarBanner(): void {
    const fd = new FormData();
    fd.append('foto_portada', '');
    this.actualizarBanner(fd);
  }

  private actualizarBanner(data: File | FormData): void {
    this.guardandoBanner.set(true);
    const fd = data instanceof FormData ? data : new FormData();
    if (data instanceof File) fd.append('foto_portada', data);

    this.usuarioService.actualizarPerfil(fd)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.usuario.update(u => u ? { ...u, ...res.data } : null);
            this.cerrarModalBanner();
            this.fotosComponent?.recargarFotos();
          }
          this.guardandoBanner.set(false);
        },
        error: (err) => {
          this.errorBanner.set(err.error?.mensaje || 'Error');
          this.guardandoBanner.set(false);
        }
      });
  }

  switchTab(tab: TabType): void {
    this.activeTab.set(tab);
  }

  abrirModalReporte(id: number): void {
    this.reportePublicacionId.set(id);
    this.showReporteModal.set(true);
    this.toggleBodyOverflow(true);
  }

  cerrarModalReporte(): void {
    this.showReporteModal.set(false);
    this.toggleBodyOverflow(false);
  }

  enviarReporte(): void {
    const id = this.reportePublicacionId();
    const motivo = this.reporteMotivo();
    if (!id || !motivo) return;

    this.reporteLoading.set(true);
    this.reportesService.crearReporte({ publicacionId: id, motivo, descripcion: this.reporteDescripcion() })
      .subscribe({
        next: (res) => {
          this.reporteSuccess.set(true);
          this.reporteLoading.set(false);
          if (res.data.totalReportes >= 5) {
            this.publicacionesReales.update(list => list.filter(p => p.id !== id));
          }
          setTimeout(() => this.cerrarModalReporte(), 2000);
        },
        error: (err) => {
          this.reporteError.set(err.mensaje || 'Error');
          this.reporteLoading.set(false);
        }
      });
  }

  openCreateModal(): void {
    console.log('Abrir modal de creación');
  }

  reintentarCarga(): void {
    const userId = this.route.snapshot.params['id'];
    userId ? this.cargarPerfilUsuario(Number(userId)) : this.cargarMiPerfil();
  }

  onLikeToggled(pubId: number): void {
    this.publicacionesReales.update(list => list.map(p => {
      if (p.id === pubId) {
        const liked = !p.liked;
        return {
          ...p,
          liked,
          likes: Math.max(0, (p.likes ?? 0) + (liked ? 1 : -1))
        };
      }
      return p;
    }));
  }

  onDocumentDownload(doc: any): void {
    if (doc.url) window.open(doc.url, '_blank');
  }

  onSectionSelected(sectionId: number): void {
    console.log('Sección seleccionada:', sectionId);
  }

  recargarSecciones(): void {
    this.cargarSecciones();
  }

  iniciarChatConUsuario(): void {
    const target = this.usuario();
    if (!target || this.isOwnProfile()) return;
    this.chatService.abrirChatCon(target.id);
  }
}
