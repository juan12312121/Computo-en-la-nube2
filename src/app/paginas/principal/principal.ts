import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { DetallePost } from '../../componentes/detalle-post/detalle-post';
import { Navbar } from '../../componentes/navbar/navbar';
import { AutenticacionService } from '../../core/servicios/autenticacion/autenticacion';
import { NoMeInteresaService } from '../../core/servicios/no-me-interesa/no-me-interesa';
import { PublicacionesOcultasService } from '../../core/servicios/ocultas/ocultas';
import { PublicacionesService } from '../../core/servicios/publicaciones/publicaciones';
import { ReportesService } from '../../core/servicios/reportes/reportes';
import { SeguidorService } from '../../core/servicios/seguidores/seguidores';
import { Theme, ThemeService } from '../../core/servicios/temas';
import { FotosService } from '../../core/servicios/fotos/fotos';
import { environment } from '../../../environments/environment';
import { Publicacion } from '../../core/modelos/publicacion.model';
import { Usuario } from '../../core/modelos/usuario.model';
import { SidebarPerfil } from '../../componentes/sidebar-perfil/sidebar-perfil';
import { SidebarCategorias } from '../../componentes/sidebar-categorias/sidebar-categorias';
import { SidebarUsuariosActivos } from '../../componentes/sidebar-usuarios-activos/sidebar-usuarios-activos';
import { AppSidebarSugerencias } from '../../componentes/app-sidebar-sugerencias/app-sidebar-sugerencias';
import { AppModalNoInteresa } from '../../componentes/app-modal-no-interesa/app-modal-no-interesa';
import { ModalReporte } from '../../componentes/modal-reporte/modal-reporte';
import { ModalCompartir } from '../../componentes/modal-compartir/modal-compartir';
import { PostCard } from '../../componentes/post-card/post-card';
import { SharingService, SharePlatform } from '../../core/servicios/sharing/sharing';
import { SocketService } from '../../core/servicios/socket/socket';
import * as Utils from '../../core/utilidades/formateadores';

export interface Post extends Publicacion {
  author: string;
  avatar: string;
  time: string;
  content: string; // Mapping contenido to content
  image: string | null; // Mapping imagen_url to image
  category: string; // Mapping categoria to category
  categoryColor: string;
  likes: number; // Mapping total_likes to likes
  shares: number; // Mapping total_compartidos to shares
  avatarColor: string;
  totalComments?: number;
  documentos?: any[];
}

const AVATAR_COLORS = [
  'linear-gradient(to bottom right, #2dd4bf, #0d9488)',
  'linear-gradient(to bottom right, #f97316, #ea580c)',
  'linear-gradient(to bottom right, #a855f7, #9333ea)',
  'linear-gradient(to bottom right, #ec4899, #db2777)',
  'linear-gradient(to bottom right, #6366f1, #8b5cf6)',
  'linear-gradient(to bottom right, #3b82f6, #2563eb)',
  'linear-gradient(to bottom right, #10b981, #059669)',
  'linear-gradient(to bottom right, #fbbf24, #f59e0b)'
];

// SHARE_URLS movido a SharingService

@Component({
  selector: 'app-principal',
  standalone: true,
  imports: [
    CommonModule, Navbar, DetallePost,
    SidebarPerfil, SidebarCategorias, SidebarUsuariosActivos,
    AppSidebarSugerencias, AppModalNoInteresa, ModalReporte,
    ModalCompartir, PostCard
  ],
  templateUrl: './principal.html',
  styleUrls: ['./principal.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Principal implements OnInit, OnDestroy {
  @ViewChild(AppSidebarSugerencias) sidebarSugerencias?: AppSidebarSugerencias;

  posts = signal<Post[]>([]);
  usuarioActual = signal<Usuario | null>(null);
  usuariosActivos = signal<any[]>([]);
  isLoading = signal(true);
  errorMessage = signal('');

  categoriaSeleccionada = signal<string | null>(null);
  publicacionesOcultas = signal(new Set<number>());
  publicacionesNoInteresan = signal(new Set<number>());
  seguidosIds = signal(new Set<number>());

  showPostDetailModal = signal(false);
  showShareModal = signal(false);
  showReportModal = signal(false);
  showNoInteresaModal = signal(false);

  selectedPost = signal<Post | null>(null);
  sharePostId = signal<number | null>(null);
  reportPostId = signal<number | null>(null);
  noInteresaPostId = signal<number | null>(null);

  linkCopied = computed(() => this.sharingService.linkCopied());
  reportMotivo = signal('');
  reportDescripcion = signal('');
  reportLoading = signal(false);
  reportSuccess = signal(false);
  reportError = signal('');

  noInteresaLoading = signal(false);
  noInteresaSuccess = signal(false);
  noInteresaError = signal('');

  categoriasDisponibles = [
    { nombre: 'General', icon: 'fa-home', color: 'text-orange-500', filtro: 'General' },
    { nombre: 'Tecnología', icon: 'fa-laptop-code', color: 'text-blue-500', filtro: 'Tecnología' },
    { nombre: 'Ciencias', icon: 'fa-flask', color: 'text-purple-500', filtro: 'Ciencias' },
    { nombre: 'Artes y Cultura', icon: 'fa-palette', color: 'text-pink-500', filtro: 'Artes y Cultura' },
    { nombre: 'Deportes', icon: 'fa-futbol', color: 'text-green-500', filtro: 'Deportes' },
    { nombre: 'Salud y Bienestar', icon: 'fa-heartbeat', color: 'text-green-500', filtro: 'Salud y Bienestar' },
    { nombre: 'Vida Universitaria', icon: 'fa-graduation-cap', color: 'text-orange-600', filtro: 'Vida Universitaria' },
    { nombre: 'Opinión', icon: 'fa-comments', color: 'text-indigo-500', filtro: 'Opinión' },
    { nombre: 'Entrevistas', icon: 'fa-microphone', color: 'text-yellow-500', filtro: 'Entrevistas' }
  ];

  private readonly destroy$ = new Subject<void>();
  public readonly apiBaseUrl = environment.apiUrl.replace('/api', '');

  // Services
  private themeService = inject(ThemeService);
  private publicacionesService = inject(PublicacionesService);
  private seguidorService = inject(SeguidorService);
  private autenticacionService = inject(AutenticacionService);
  private reportesService = inject(ReportesService);
  private publicacionesOcultasService = inject(PublicacionesOcultasService);
  private noMeInteresaService = inject(NoMeInteresaService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public sharingService = inject(SharingService);
  private socketService = inject(SocketService);

  currentTheme = signal<Theme>(this.themeService.getCurrentTheme());
  usuarioActualId = computed(() => this.usuarioActual()?.id || null);

  postsFiltrados = computed(() => {
    const allPosts = this.posts();
    const categoria = this.categoriaSeleccionada();
    if (!categoria) return allPosts;
    return allPosts.filter(p => p.categoria && p.categoria.toLowerCase() === categoria.toLowerCase());
  });

  constructor() { }

  ngOnInit(): void {
    this.themeService.currentTheme$
      .pipe(takeUntil(this.destroy$))
      .subscribe(theme => this.currentTheme.set(theme));

    this.cargarDatosUsuarioActual();
    this.cargarUsuariosActivosEstatico();
    this.inicializarFeed();
    this.setupSocketListeners();
  }

  private setupSocketListeners(): void {
    // Escuchar nuevos posts
    this.socketService.onEvent<any>('new_post')
      .pipe(takeUntil(this.destroy$))
      .subscribe(postData => {
        const transformed = this.convertirPublicacionAPost(postData);
        // Evitar duplicados si el usuario actual es quien lo creó
        if (!this.posts().some(p => p.id === transformed.id)) {
          this.posts.update(list => [transformed, ...list]);
        }
      });

    // Escuchar actualizaciones de likes
    this.socketService.onEvent<{ publicacion_id: number, total: number }>('like_update')
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.posts.update(list => list.map(p => {
          if (p.id === data.publicacion_id) {
            return { ...p, likes: data.total };
          }
          return p;
        }));
      });

    // Escuchar nuevos comentarios (para actualizar contador)
    this.socketService.onEvent<{ publicacion_id: number }>('new_comment')
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.posts.update(list => list.map(p => {
          if (p.id === data.publicacion_id) {
            return { ...p, totalComments: (p.totalComments || 0) + 1 };
          }
          return p;
        }));
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ========== INICIALIZACIÓN ==========
  private async inicializarFeed(): Promise<void> {
    this.isLoading.set(true);

    try {
      await this.cargarSeguidos();
      await this.cargarMarcasUsuario();
      await this.cargarFeed();
    } catch (error) {
      this.errorMessage.set('Error al cargar el contenido');
    } finally {
      this.isLoading.set(false);
    }
  }

  private cargarMarcasUsuario(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.autenticacionService.isAuthenticated()) {
        return resolve();
      }

      let completadas = 0;
      const verificarCompleto = () => {
        completadas++;
        if (completadas === 2) resolve();
      };

      this.publicacionesOcultasService.obtenerPublicacionesOcultas()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            if (res.success && Array.isArray(res.data)) {
              this.publicacionesOcultas.set(new Set(res.data.map(p => p.id)));
            }
            verificarCompleto();
          },
          error: () => verificarCompleto()
        });

      this.noMeInteresaService.obtenerPublicacionesNoInteresan()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            if (res.success && Array.isArray(res.data)) {
              this.publicacionesNoInteresan.set(new Set(res.data.map(p => p.id)));
            }
            verificarCompleto();
          },
          error: () => verificarCompleto()
        });
    });
  }

  private cargarFeed(): Promise<void> {
    return new Promise((resolve) => {
      this.publicacionesService.obtenerPublicaciones()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            if (!res.success || !Array.isArray(res.data)) {
              this.posts.set([]);
              return resolve();
            }

            const publicacionesFiltradas = res.data.filter(pub => {
              const esOculta = this.publicacionesOcultas().has(pub.id);
              const esNoInteresa = this.publicacionesNoInteresan().has(pub.id);
              return !esOculta && !esNoInteresa;
            });

            const postsConvertidos = this.convertirPublicacionesAPosts(publicacionesFiltradas);
            const postsVisibles = this.filtrarPorVisibilidad(postsConvertidos);

            this.posts.set(this.organizarPosts(postsVisibles));
            resolve();
          },
          error: () => {
            this.posts.set([]);
            resolve();
          }
        });
    });
  }

  private organizarPosts(posts: Post[]): Post[] {
    const miId = this.usuarioActualId();
    const seguidos = this.seguidosIds();

    const mias = posts.filter(p => p.usuario_id === miId);
    const deSeguidos = posts.filter(p => p.usuario_id && seguidos.has(p.usuario_id));
    const otros = posts.filter(p =>
      p.usuario_id !== miId &&
      !seguidos.has(p.usuario_id!)
    );

    const resultado: Post[] = [...mias.slice(0, 3)];
    let i = 0, j = 0;

    while (i < deSeguidos.length || j < otros.length) {
      resultado.push(...deSeguidos.slice(i, i + 3));
      i += 3;
      if (j < otros.length) resultado.push(otros[j++]);
    }

    return [...resultado, ...mias.slice(3)];
  }

  private convertirPublicacionesAPosts(pubs: any[]): Post[] {
    return pubs.map(p => this.convertirPublicacionAPost(p)).filter(p => p.id && p.usuario_id);
  }

  private convertirPublicacionAPost(p: any): Post {
    return {
      ...p,
      id: p.id,
      author: p.nombre_completo || p.nombre_usuario || 'Usuario',
      avatar: Utils.obtenerIniciales(p.nombre_completo || p.nombre_usuario || 'U'),
      time: p.fecha_creacion ? Utils.formatearTiempo(p.fecha_creacion) : 'Ahora',
      content: p.contenido || '',
      image: Utils.normalizarUrlImagen(p.imagen_url || '', this.apiBaseUrl),
      category: p.category || p.categoria || 'General',
      categoryColor: this.publicacionesService.obtenerColorCategoria(p.category || p.categoria || 'General'),
      likes: p.total_likes ?? p.likes ?? 0,
      liked: !!(p.usuario_dio_like || p.liked),
      shares: p.total_compartidos ?? p.shares ?? 0,
      avatarColor: Utils.generarColorAvatar(p.usuario_id, AVATAR_COLORS),
      usuario_id: p.usuario_id,
      total_comentarios: p.total_comentarios ?? p.totalComments ?? 0,
      documentos: p.documentos || [],
      visibilidad: p.visibilidad || 'publico',
      contenido: p.contenido || '',
      fecha_creacion: p.fecha_creacion || '',
      nombre_completo: p.nombre_completo || '',
      nombre_usuario: p.nombre_usuario || '',
      categoria: p.categoria || 'General'
    };
  }

  private filtrarPorVisibilidad(posts: Post[]): Post[] {
    const miId = this.usuarioActualId();
    const seguidos = this.seguidosIds();

    return posts.filter(post => {
      if (post.usuario_id === miId) return true;
      const visibilidad = post.visibilidad || 'publico';

      if (visibilidad === 'publico') return true;
      if (visibilidad === 'seguidores') return miId && seguidos.has(post.usuario_id!);
      return false;
    });
  }

  // ========== EVENTOS DEL POST-CARD ==========
  onPostLikeChanged(data: { postId: number; liked: boolean; likes: number }): void {
    this.posts.update(current => current.map(p =>
      p.id === data.postId ? { ...p, liked: data.liked, likes: data.likes } : p
    ));
  }

  onPostHidden(postId: number): void {
    this.publicacionesOcultasService.ocultarPublicacion(postId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.publicacionesOcultas.update(set => new Set(set).add(postId));
            this.posts.update(list => list.filter(p => p.id !== postId));
            alert('✅ Publicación ocultada');
          }
        }
      });
  }

  onPostNoInteresa(postId: number): void {
    this.noInteresaPostId.set(postId);
    this.showNoInteresaModal.set(true);
    this.noInteresaError.set('');
    this.noInteresaSuccess.set(false);
    document.body.style.overflow = 'hidden';
  }

  onPostReported(postId: number): void {
    this.reportPostId.set(postId);
    this.showReportModal.set(true);
    this.reportMotivo.set('');
    this.reportDescripcion.set('');
    this.reportError.set('');
    this.reportSuccess.set(false);
    document.body.style.overflow = 'hidden';
  }

  onPostShared(postId: number): void {
    this.sharePostId.set(postId);
    this.showShareModal.set(true);
    document.body.style.overflow = 'hidden';
  }

  onPostEdited(data: { postId: number; content: string }): void {
    const formData = new FormData();
    formData.append('contenido', data.content);

    this.publicacionesService.actualizarPublicacion(data.postId, formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.posts.update(list => list.map(p =>
              p.id === data.postId ? { ...p, content: data.content } : p
            ));
            alert('✅ Publicación actualizada');
          }
        }
      });
  }

  onPostDeleted(postId: number): void {
    this.publicacionesService.eliminarPublicacion(postId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.posts.update(list => list.filter(p => p.id !== postId));
            alert('✅ Publicación eliminada');
          }
        }
      });
  }

  onOpenPostDetailModal(postId: number): void {
    const post = this.posts().find(p => p.id === postId);
    if (post) {
      this.selectedPost.set(post);
      this.showPostDetailModal.set(true);
      document.body.style.overflow = 'hidden';
    }
  }

  // ========== MODALES ==========
  closePostDetail(): void {
    this.showPostDetailModal.set(false);
    this.selectedPost.set(null);
    document.body.style.overflow = 'auto';
  }

  closeShareModal(): void {
    this.showShareModal.set(false);
    this.sharePostId.set(null);
    document.body.style.overflow = 'auto';
  }

  shareToSocial(platform: string): void {
    const post = this.posts().find(p => p.id === this.sharePostId());
    if (!post) return;

    this.sharingService.compartir(platform as SharePlatform, post.id, post.content);

    this.posts.update(list => list.map(p =>
      p.id === post.id ? { ...p, shares: p.shares + 1 } : p
    ));
  }

  async copyLink(): Promise<void> {
    const id = this.sharePostId();
    if (id) await this.sharingService.copiarAlPortapapeles(id);
  }

  closeReportModal(): void {
    this.showReportModal.set(false);
    this.reportPostId.set(null);
    document.body.style.overflow = 'auto';
  }

  submitReport(): void {
    const postId = this.reportPostId();
    const motivo = this.reportMotivo();
    if (!postId || !motivo.trim()) {
      this.reportError.set('Debes seleccionar un motivo');
      return;
    }

    this.reportLoading.set(true);
    this.reportError.set('');

    this.reportesService.crearReporte({
      publicacionId: postId,
      motivo: motivo,
      descripcion: this.reportDescripcion().trim() || undefined
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.reportLoading.set(false);
          if (res.success) {
            this.reportSuccess.set(true);
            setTimeout(() => this.closeReportModal(), 2000);
          } else {
            this.reportError.set(res.message || 'Error');
          }
        },
        error: () => {
          this.reportLoading.set(false);
          this.reportError.set('Error al enviar');
        }
      });
  }

  closeNoInteresaModal(): void {
    this.showNoInteresaModal.set(false);
    this.noInteresaPostId.set(null);
    document.body.style.overflow = 'auto';
  }

  submitNoInteresa(): void {
    const postId = this.noInteresaPostId();
    if (!postId) return;

    this.noInteresaLoading.set(true);
    this.noMeInteresaService.marcarNoInteresa(postId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.noInteresaLoading.set(false);
          if (res.success) {
            this.noInteresaSuccess.set(true);
            this.publicacionesNoInteresan.update(set => new Set(set).add(postId));
            this.posts.update(list => list.filter(p => p.id !== postId));
            setTimeout(() => this.closeNoInteresaModal(), 2000);
          } else {
            this.noInteresaError.set(res.message || 'Error');
          }
        },
        error: () => {
          this.noInteresaLoading.set(false);
          this.noInteresaError.set('Error');
        }
      });
  }

  // ========== FILTROS Y SEGUIDOS ==========
  filtrarPorCategoria(categoria: string): void {
    this.categoriaSeleccionada.update(current => current === categoria ? null : categoria);
  }

  seguirUsuario(usuarioId: number): void {
    if (!this.autenticacionService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    this.seguidorService.seguir(usuarioId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.seguidosIds.update(set => new Set(set).add(usuarioId));
            setTimeout(() => this.sidebarSugerencias?.recargarSugerencias(), 1000);
            alert('✅ Ahora sigues a este usuario');
          }
        }
      });
  }

  private cargarSeguidos(): Promise<void> {
    return new Promise(resolve => {
      const id = this.usuarioActualId();
      if (!id) return resolve();

      this.seguidorService.listarSeguidos(id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            const ids = res.success ? res.data.seguidos.map((u: any) => u.id) : [];
            this.seguidosIds.set(new Set(ids));
            resolve();
          },
          error: () => resolve()
        });
    });
  }

  // ========== UTILIDADES ==========
  onPublicacionCreada(pub: any): void {
    if (!pub) return;

    const newPost = this.convertirPublicacionAPost(pub);

    this.posts.update(list => [newPost, ...list]);
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
  }

  private abrirPostDesdeURL(postId: number): void {
    const intentar = (intentos = 0) => {
      if (intentos > 20) return;
      const post = this.posts().find(p => p.id === postId);
      if (post) {
        setTimeout(() => this.onOpenPostDetailModal(postId), 100);
      } else if (this.isLoading()) {
        setTimeout(() => intentar(intentos + 1), 200);
      }
    };
    intentar();
  }

  private cargarDatosUsuarioActual(): void {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        this.usuarioActual.set(JSON.parse(userStr));
      } catch {
        console.error('Error al parsear usuario');
      }
    }
  }

  private cargarUsuariosActivosEstatico(): void {
    this.usuariosActivos.set([
      {
        id: 2,
        nombre_usuario: 'elasaltacunas',
        nombre_completo: 'Jesus Ayala',
        foto_perfil_url: null,
        carrera: 'Licenciatura en levantar culitos en el gym',
        total_seguidores: 45,
        estaConectado: true
      },
      {
        id: 3,
        nombre_usuario: 'Juan',
        nombre_completo: 'Campos',
        foto_perfil_url: null,
        carrera: 'Ingeniería en Software',
        total_seguidores: 23,
        estaConectado: true
      }
    ]);
  }

  obtenerMotivosValidos(): string[] {
    return this.reportesService.obtenerMotivosValidos();
  }

  trackByPostId(index: number, post: Post): number {
    return post.id;
  }

  onSugerenciasCargadas(cantidad: number): void { }
}
