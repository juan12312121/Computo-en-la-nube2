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

    // Escuchar nuevas publicaciones
    this.socketService.onEvent<any>('new_post')
      .pipe(takeUntil(this.destroy$))
      .subscribe(postData => {
        const user = this.usuario();
        if (user && postData.usuario_id === user.id) {
          if (!this.publicacionesReales().some(p => p.id === postData.id)) {
            this.publicacionesReales.update(list => [{ ...postData, liked: false }, ...list]);
          }
        }
      });

    // Escuchar actualizaciones de publicación
    this.socketService.onEvent<any>('update_post')
      .pipe(takeUntil(this.destroy$))
      .subscribe(postData => {
        this.publicacionesReales.update(list => list.map(p => p.id === postData.id ? { ...p, ...postData } : p));
      });

    // Escuchar borrado de publicación
    this.socketService.onEvent<{ id: number }>('delete_post')
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.publicacionesReales.update(list => list.filter(p => p.id !== data.id));
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
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

    console.group('%c[Perfil] guardarPerfil()', 'color: #6366f1; font-weight: bold; font-size: 14px;');
    console.log('Usuario actual:', { id: user.id, nombre: user.nombre_completo });
    console.log('Formulario recibido:', data.formulario);
    console.log('¿Tiene archivo de foto?:', !!data.archivo);

    if (data.archivo) {
      console.group('📁 Archivo foto de perfil');
      console.log('Nombre    :', data.archivo.name);
      console.log('Tipo MIME :', data.archivo.type);
      console.log('Tamaño    :', (data.archivo.size / 1024).toFixed(2) + ' KB');
      console.log('Límite    :', (5 * 1024).toFixed(0) + ' KB (5 MB)');
      console.log('¿Pasa límite?:', data.archivo.size <= 5 * 1024 * 1024 ? '✅ Sí' : '❌ No, demasiado grande');
      console.log('Objeto File completo:', data.archivo);
      console.groupEnd();
    } else {
      console.warn('⚠️ No se adjuntó archivo — solo se actualizan campos de texto');
    }

    this.guardandoPerfil.set(true);
    const formData = new FormData();
    const fields = ['nombre_completo', 'biografia', 'ubicacion', 'carrera'] as const;

    fields.forEach(f => {
      const valor = data.formulario[f] || (user[f] as string) || '';
      formData.append(f, valor);
      console.log(`FormData campo "${f}":`, valor);
    });

    if (data.archivo) {
      formData.append('foto_perfil', data.archivo);
      console.log('FormData campo "foto_perfil": [File adjuntado]');
    }

    // Verificar contenido del FormData
    console.group('📦 Contenido final del FormData');
    formData.forEach((value, key) => {
      if (value instanceof File) {
        console.log(`  ${key}:`, `[File: ${value.name}, ${(value.size/1024).toFixed(2)}KB, ${value.type}]`);
      } else {
        console.log(`  ${key}:`, value);
      }
    });
    console.groupEnd();

    console.log('🚀 Enviando petición a actualizarPerfil...');

    this.usuarioService.actualizarPerfil(formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          console.group('%c✅ Respuesta servidor - guardarPerfil', 'color: green; font-weight: bold;');
          console.log('res.success:', res.success);
          console.log('res.data completo:', res.data);
          console.log('foto_perfil_url nueva:', res.data?.foto_perfil_url);
          console.log('foto_portada_url:', res.data?.foto_portada_url);
          console.groupEnd();

          if (res.success && res.data) {
            console.log('🔄 Actualizando signal usuario con:', res.data);
            this.usuario.update(u => {
              const actualizado = u ? { ...u, ...res.data } : null;
              console.log('Signal usuario ANTES:', u);
              console.log('Signal usuario DESPUÉS:', actualizado);
              return actualizado;
            });
            console.log('📸 profileImage que se pasará al hijo:', this.getProfileImage());
            this.cerrarModalEdicion();
            this.fotosComponent?.recargarFotos();
            alert('✅ Perfil actualizado correctamente');
          } else {
            console.warn('⚠️ res.success es false o res.data vacío — no se actualiza el signal');
          }
          this.guardandoPerfil.set(false);
          console.groupEnd();
        },
        error: (err) => {
          console.group('%c❌ Error en guardarPerfil', 'color: red; font-weight: bold;');
          console.error('HTTP Status  :', err.status);
          console.error('URL          :', err.url);
          console.error('err.error    :', err.error);
          console.error('Mensaje      :', err.error?.mensaje || err.message);
          console.error('Object completo:', err);
          console.groupEnd();
          this.mensajeError.set(err.error?.mensaje || 'Error al actualizar');
          this.guardandoPerfil.set(false);
        }
      });
  }

  guardarBanner(archivo: File) {
    console.group('%c[Perfil] guardarBanner()', 'color: #14b8a6; font-weight: bold; font-size: 14px;');
    console.log('¿Es instancia de File?:', archivo instanceof File);

    if (!archivo) {
      console.error('❌ archivo es null/undefined — el modal no envió el archivo');
      console.groupEnd();
      return;
    }

    console.group('📁 Archivo portada');
    console.log('Nombre    :', archivo.name);
    console.log('Tipo MIME :', archivo.type);
    console.log('Tamaño    :', (archivo.size / 1024).toFixed(2) + ' KB');
    console.log('¿Pasa límite 5MB?:', archivo.size <= 5 * 1024 * 1024 ? '✅ Sí' : '❌ No');
    console.log('Objeto File:', archivo);
    console.groupEnd();

    const user = this.usuario();
    if (!user) {
      console.error('❌ usuario() es null — no se puede continuar');
      console.groupEnd();
      return;
    }

    console.log('Usuario que sube portada:', { id: user.id, nombre: user.nombre_completo });

    const formData = new FormData();
    formData.append('nombre_completo', user.nombre_completo || '');
    formData.append('biografia', user.biografia || '');
    formData.append('ubicacion', user.ubicacion || '');
    formData.append('carrera', user.carrera || '');
    formData.append('foto_portada', archivo, archivo.name);

    console.group('📦 Contenido final del FormData (banner)');
    formData.forEach((value, key) => {
      if (value instanceof File) {
        console.log(`  ${key}:`, `[File: ${value.name}, ${(value.size/1024).toFixed(2)}KB, ${value.type}]`);
      } else {
        console.log(`  ${key}:`, value);
      }
    });
    console.groupEnd();

    console.log('🚀 Llamando a actualizarBanner...');
    this.actualizarBanner(formData);
    console.groupEnd();
  }

  actualizarBanner(formData: FormData) {
    console.group('%c[Perfil] actualizarBanner() — petición HTTP', 'color: #14b8a6; font-weight: bold;');
    this.guardandoBanner.set(true);
    this.errorBanner.set('');

    console.log('guardandoBanner → true');
    console.log('Enviando FormData al servidor...');

    this.usuarioService.actualizarPerfil(formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          console.group('%c✅ Respuesta servidor - actualizarBanner', 'color: green; font-weight: bold;');
          console.log('res.success          :', res.success);
          console.log('res.data completo    :', res.data);
          console.log('foto_portada_url nueva:', res.data?.foto_portada_url);
          console.log('foto_perfil_url      :', res.data?.foto_perfil_url);
          console.groupEnd();

          if (res.success && res.data?.foto_portada_url) {
            console.log('🔄 Actualizando signal usuario con nueva portada...');
            this.usuario.update(u => {
              const antes = u?.foto_portada_url;
              const despues = res.data.foto_portada_url;
              console.log('foto_portada_url ANTES  :', antes);
              console.log('foto_portada_url DESPUÉS:', despues);
              return u ? { ...u, foto_portada_url: despues } : null;
            });
            console.log('📸 coverImage que se pasará al hijo:', this.getCoverImage());
            alert('✅ Portada actualizada correctamente');
          } else {
            console.warn('⚠️ res.data?.foto_portada_url está vacío — el signal NO se actualizará');
            console.warn('Verifica que el backend devuelva foto_portada_url en res.data');
          }

          this.guardandoBanner.set(false);
          this.showBannerModal.set(false);
          console.log('guardandoBanner → false, modal cerrado');
          console.groupEnd();
        },
        error: (err) => {
          console.group('%c❌ Error en actualizarBanner', 'color: red; font-weight: bold;');
          console.error('HTTP Status   :', err.status);
          console.error('URL           :', err.url);
          console.error('err.error     :', err.error);
          console.error('Mensaje       :', err.error?.mensaje || err.message);
          console.error('Headers       :', err.headers);
          console.error('Objeto completo:', err);
          console.groupEnd();
          this.errorBanner.set(err.error?.mensaje || 'Error al actualizar la portada');
          this.guardandoBanner.set(false);
        }
      });
  }

  // Log también en getProfileImage y getCoverImage
  getProfileImage(): string | null {
    const raw = this.usuario()?.foto_perfil_url || '';
    const normalizada = Utils.normalizarUrlImagen(raw, this.apiBaseUrl, 'perfiles');
    console.log('[getProfileImage] raw:', raw, '→ normalizada:', normalizada);
    return normalizada;
  }

  getCoverImage(): string | null {
    const raw = this.usuario()?.foto_portada_url || '';
    const normalizada = Utils.normalizarUrlImagen(raw, this.apiBaseUrl, 'portadas');
    console.log('[getCoverImage] raw:', raw, '→ normalizada:', normalizada);
    return normalizada;
  }

  abrirModalCambiarBanner(): void {
    this.showBannerModal.set(true);
    this.toggleBodyOverflow(true);
  }

  cerrarModalBanner(): void {
    this.showBannerModal.set(false);
    this.toggleBodyOverflow(false);
  }

 


  eliminarBanner(): void {
    const user = this.usuario();
    if (!user) return;

    const fd = new FormData();
    fd.append('nombre_completo', user.nombre_completo || '');
    fd.append('foto_portada', '');
    this.actualizarBanner(fd);
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
