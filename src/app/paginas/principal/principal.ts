import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { DetallePost } from '../../componentes/detalle-post/detalle-post';
import { Navbar } from '../../componentes/navbar/navbar';
import { AutenticacionService } from '../../core/servicios/autenticacion/autenticacion';
import { ComentariosService } from '../../core/servicios/comentarios/comentarios';
import { LikesService } from '../../core/servicios/likes/likes';
import { NoMeInteresaService } from '../../core/servicios/no-me-interesa/no-me-interesa';
import { PublicacionesOcultasService } from '../../core/servicios/ocultas/ocultas';
import { PublicacionesService } from '../../core/servicios/publicaciones/publicaciones';
import { ReportesService } from '../../core/servicios/reportes/reportes';
import { SeguidorService } from '../../core/servicios/seguidores/seguidores';
import { Theme, ThemeService } from '../../core/servicios/temas';
import { FotosService } from '../../core/servicios/fotos/fotos';
import { SidebarPerfil } from '../../componentes/sidebar-perfil/sidebar-perfil';
import { SidebarCategorias } from '../../componentes/sidebar-categorias/sidebar-categorias';
import { SidebarUsuariosActivos } from '../../componentes/sidebar-usuarios-activos/sidebar-usuarios-activos';
import { AppSidebarSugerencias } from '../../componentes/app-sidebar-sugerencias/app-sidebar-sugerencias';
import { AppModalNoInteresa } from '../../componentes/app-modal-no-interesa/app-modal-no-interesa';
import { ModalReporte } from '../../componentes/modal-reporte/modal-reporte';
import { ModalCompartir } from '../../componentes/modal-compartir/modal-compartir';

interface Comment {
  id: number;
  author: string;
  avatar: string;
  text: string;
  time: string;
  avatarColor: string;
  usuario_id?: number;
  foto_perfil_url?: string | null;
  usandoIniciales?: boolean;
}

interface Documento {
  id: number;
  usuario_id: number;
  publicacion_id: number;
  documento_s3: string;
  nombre_archivo: string;
  tamano_archivo: number;
  tipo_archivo: string;
  icono: string;
  color: string;
  fecha_creacion: string;
}

interface Post {
  id: number;
  author: string;
  avatar: string;
  time: string;
  content: string;
  image: string | null;
  category: string;
  categoryColor: string;
  likes: number;
  liked: boolean;
  shares: number;
  avatarColor: string;
  comments: Comment[];
  showComments?: boolean;
  usuarioId?: number;
  loadingComments?: boolean;
  commentsLoaded?: boolean;
  totalComments?: number;
  likeLoading?: boolean;
  showOptions?: boolean;
  documentos?: Documento[];
}

interface User {
  id: number;
  name: string;
  username: string;
  avatar: string;
  avatarColor: string;
  isFollowing: boolean;
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

const THEME_COLORS: { [key: string]: string } = {
  'default': '#f97316', 'midnight': '#6366f1', 'forest': '#10b981',
  'sunset': '#f59e0b', 'ocean': '#0ea5e9', 'rose': '#ec4899',
  'slate': '#64748b', 'lavender': '#a78bfa', 'neon': '#0ff',
  'toxic': '#84cc16', 'candy': '#ec4899', 'chaos': '#ff0000'
};

const SHARE_URLS: { [key: string]: (url: string, text: string) => string } = {
  whatsapp: (url, text) => `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
  facebook: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  twitter: (url, text) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  linkedin: (url) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  telegram: (url, text) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  email: (url, text) => `mailto:?subject=${encodeURIComponent('Mira esta publicación')}&body=${encodeURIComponent(text + '\n\n' + url)}`
};

@Component({
  selector: 'app-principal',
  standalone: true,
  imports: [
    CommonModule, FormsModule, Navbar, DetallePost, SidebarPerfil, SidebarCategorias,
    SidebarUsuariosActivos, AppSidebarSugerencias, AppModalNoInteresa, ModalReporte, ModalCompartir
  ],
  templateUrl: './principal.html',
  styleUrls: ['./principal.css']
})
export class Principal implements OnInit, OnDestroy {
  @ViewChild(AppSidebarSugerencias) sidebarSugerencias?: AppSidebarSugerencias;

  posts: Post[] = [];
  users: User[] = [];
  currentTheme!: Theme;
  usuarioActualId: number | null = null;
  showCreateModal = false;
  showPostDetailModal = false;
  showShareModal = false;
  showReportModal = false;
  showNoInteresaModal = false;
  selectedPost: Post | null = null;
  sharePostId: number | null = null;
  reportPostId: number | null = null;
  noInteresaPostId: number | null = null;
  isLoading = true;
  errorMessage = '';
  linkCopied = false;
  commentInputs: { [key: number]: string } = {};
  
  comentarioCensuradoMensaje: { [key: number]: string } = {};
  mostrandoAlertaCensura: { [key: number]: boolean } = {};
  nivelCensura: { [key: number]: string } = {};
  
  reportMotivo: string = '';
  reportDescripcion: string = '';
  reportLoading = false;
  reportSuccess = false;
  reportError = '';
  noInteresaLoading = false;
  noInteresaSuccess = false;
  noInteresaError = '';
  ocultarLoading = false;
  usuarioActual: any = null;
  usuariosActivos: any[] = [];
  
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
  categoriaSeleccionada: string | null = null;
  publicacionesOcultas = new Set<number>();
  publicacionesNoInteresan = new Set<number>();
  fotosPerfilCache = new Map<number, string | null>();
  seguidosIds = new Set<number>();
  private themeSubscription?: Subscription;
  private destroy$ = new Subject<void>();
  public readonly apiBaseUrl = window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : 'http://3.146.83.30:3000';
  public readonly s3BaseUrl = 'https://redstudent-uploads.s3.us-east-2.amazonaws.com';

  constructor(
    private themeService: ThemeService,
    private publicacionesService: PublicacionesService,
    private seguidorService: SeguidorService,
    private comentariosService: ComentariosService,
    private likesService: LikesService,
    private autenticacionService: AutenticacionService,
    private reportesService: ReportesService,
    private publicacionesOcultasService: PublicacionesOcultasService,
    private noMeInteresaService: NoMeInteresaService,
    private route: ActivatedRoute,
    private fotosService: FotosService
  ) {
    this.currentTheme = this.themeService.getCurrentTheme();
  }

  ngOnInit(): void {
    this.themeSubscription = this.themeService.currentTheme$
      .pipe(takeUntil(this.destroy$))
      .subscribe(theme => {
        this.currentTheme = theme;
      });

    this.usuarioActualId = this.obtenerUsuarioActualId();
    this.cargarDatosUsuarioActual();
    this.cargarUsuariosActivosEstatico();
    this.inicializarFeed();

    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const postId = params['id'];
        if (postId) {
          this.abrirPostDesdeURL(Number(postId));
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async inicializarFeed(): Promise<void> {
    this.isLoading = true;
    try {
      await this.cargarSeguidos();
      await this.cargarMarcasUsuario();
      await this.cargarFeed();
      this.cargarUsuarios();

      if (this.autenticacionService.isAuthenticated()) {
        this.verificarLikesDelUsuario();
      }
    } catch (error) {
      console.error('Error al inicializar feed:', error);
      this.errorMessage = 'Error al cargar el contenido';
      this.cargarDatosEjemplo();
    } finally {
      this.isLoading = false;
    }
  }

  private cargarMarcasUsuario(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.autenticacionService.isAuthenticated()) {
        return resolve();
      }

      let completadas = 0;
      const total = 2;

      const verificarCompleto = () => {
        completadas++;
        if (completadas === total) resolve();
      };

      this.publicacionesOcultasService.obtenerPublicacionesOcultas()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success && Array.isArray(response.data)) {
              this.publicacionesOcultas = new Set(response.data.map(p => p.id));
            }
            verificarCompleto();
          },
          error: () => verificarCompleto()
        });

      this.noMeInteresaService.obtenerPublicacionesNoInteresan()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success && Array.isArray(response.data)) {
              this.publicacionesNoInteresan = new Set(response.data.map(p => p.id));
            }
            verificarCompleto();
          },
          error: () => verificarCompleto()
        });
    });
  }

  private abrirPostDesdeURL(postId: number): void {
    const intentarAbrir = (intentos = 0) => {
      if (intentos > 20) return;
      const post = this.posts.find(p => p.id === postId);
      if (post) {
        setTimeout(() => this.openPostDetail(postId), 100);
      } else if (this.isLoading) {
        setTimeout(() => intentarAbrir(intentos + 1), 200);
      }
    };
    intentarAbrir();
  }

  private cargarFeed(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.publicacionesService.obtenerPublicaciones()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            console.log('📦 Respuesta completa del backend:', res);
            
            if (!res.success || !Array.isArray(res.data)) {
              this.posts = [];
              this.cargarDatosEjemplo();
              return resolve();
            }

            if (res.data.length === 0) {
              this.posts = [];
              return resolve();
            }

            try {
              const publicacionesFiltradas = res.data.filter(pub => {
                return !this.publicacionesOcultas.has(pub.id) && !this.publicacionesNoInteresan.has(pub.id);
              });

              const postsConvertidos = this.convertirPublicacionesAPosts(publicacionesFiltradas);
              this.posts = this.organizarPosts(postsConvertidos);
            } catch (error) {
              console.error('❌ Error procesando posts:', error);
              this.posts = [];
              this.cargarDatosEjemplo();
            }

            resolve();
          },
          error: (err) => {
            console.error('❌ Error cargando feed:', err);
            this.cargarDatosEjemplo();
            reject(err);
          }
        });
    });
  }

  private organizarPosts(posts: Post[]): Post[] {
    const mias = posts.filter(p => p.usuarioId === this.usuarioActualId);
    const seguidos = posts.filter(p => p.usuarioId && this.seguidosIds.has(p.usuarioId));
    const otros = posts.filter(p => p.usuarioId !== this.usuarioActualId && !this.seguidosIds.has(p.usuarioId!));

    const resultado: Post[] = [...mias.slice(0, 3)];
    let i = 0, j = 0;

    while (i < seguidos.length || j < otros.length) {
      resultado.push(...seguidos.slice(i, i + 3));
      i += 3;
      if (j < otros.length) resultado.push(otros[j++]);
    }

    return [...resultado, ...mias.slice(3)];
  }

  private convertirPublicacionesAPosts(pubs: any[]): Post[] {
    if (!Array.isArray(pubs) || pubs.length === 0) return [];

    return pubs.map((p, index) => {
      try {
        const pubAny = p as any;
        
        if (!p.id || !p.usuario_id) return null;

        // 🔥 IMPORTANTE: Extraer correctamente los conteos del backend
        const totalLikes = pubAny.total_likes ?? pubAny.likes ?? 0;
        const totalComentarios = pubAny.total_comentarios ?? pubAny.comentarios ?? 0;
        const totalCompartidos = pubAny.total_compartidos ?? pubAny.compartidos ?? 0;

        console.log(`✅ Post ${p.id}:`, {
          total_likes: totalLikes,
          total_comentarios: totalComentarios,
          total_compartidos: totalCompartidos
        });

        const postConvertido: Post = {
          id: p.id,
          author: p.nombre_completo || p.nombre_usuario || 'Usuario',
          avatar: this.obtenerIniciales(p.nombre_completo || p.nombre_usuario || 'U'),
          time: this.formatearTiempo(p.fecha_creacion),
          content: p.contenido || '',
          image: this.normalizarUrlImagen(p.imagen_s3 || p.imagen_url || ''),
          category: p.categoria || 'General',
          categoryColor: p.color_categoria || this.publicacionesService.obtenerColorCategoria(p.categoria || 'General'),
          likes: totalLikes,
          liked: false,
          shares: totalCompartidos,
          avatarColor: this.generarColorAvatar(p.usuario_id),
          comments: [],
          showComments: false,
          usuarioId: p.usuario_id,
          loadingComments: false,
          commentsLoaded: false,
          totalComments: totalComentarios,
          likeLoading: false,
          showOptions: false,
          documentos: p.documentos || []
        };

        return postConvertido;
      } catch (error) {
        console.error('❌ Error convirtiendo post:', error);
        return null;
      }
    }).filter(p => p !== null) as Post[];
  }

  private cargarSeguidos(): Promise<void> {
    return new Promise(resolve => {
      if (!this.usuarioActualId) return resolve();

      this.seguidorService.listarSeguidos(this.usuarioActualId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success && response.data && response.data.seguidos) {
              this.seguidosIds = new Set(response.data.seguidos.map(u => u.id));
            } else {
              this.seguidosIds = new Set();
            }
            resolve();
          },
          error: () => {
            this.seguidosIds = new Set();
            resolve();
          }
        });
    });
  }

  private cargarUsuarios(): void {
    if (!this.usuarioActualId) return;

    this.seguidorService.listarSeguidos(this.usuarioActualId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (!response.success || !response.data) {
            this.users = [];
            return;
          }

          if (Array.isArray(response.data.seguidos) && response.data.seguidos.length > 0) {
            this.users = response.data.seguidos.map(u => ({
              id: u.id,
              name: u.nombre_completo || 'Usuario',
              username: '@' + (u.nombre_usuario || 'usuario'),
              avatar: this.obtenerIniciales(u.nombre_completo || u.nombre_usuario || 'U'),
              avatarColor: this.generarColorAvatar(u.id),
              isFollowing: true
            }));
          } else {
            this.users = [];
          }
        },
        error: () => {
          this.users = [];
        }
      });
  }

  private verificarLikesDelUsuario(): void {
    this.posts.forEach(post => {
      this.likesService.verificarLike(post.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success && response.data) {
              const postActualizar = this.posts.find(p => p.id === post.id);
              if (postActualizar && response.data.liked !== undefined) {
                postActualizar.liked = response.data.liked;
              }
            }
          },
          error: () => {}
        });
    });
  }

  toggleLike(postId: number): void {
    if (!this.autenticacionService.isAuthenticated()) {
      alert('Debes iniciar sesión para dar like');
      return;
    }

    const post = this.posts.find(p => p.id === postId);
    if (!post || post.likeLoading) return;

    const likeAnterior = post.liked;
    const likesAnterior = post.likes;

    post.liked = !post.liked;
    post.likes += post.liked ? 1 : -1;
    post.likeLoading = true;

    this.likesService.toggleLike(postId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          post.likeLoading = false;
        },
        error: (error) => {
          post.liked = likeAnterior;
          post.likes = likesAnterior;
          post.likeLoading = false;

          if (error.status === 401) {
            alert('Debes iniciar sesión para dar like');
          } else {
            alert('Error al actualizar like. Intenta de nuevo.');
          }
        }
      });
  }

  private cargarFotosPerfilBatch(usuariosIds: number[]): void {
    const idsNoEnCache = usuariosIds.filter(id => !this.fotosPerfilCache.has(id));
    if (idsNoEnCache.length === 0) return;

    this.fotosService.obtenerFotosBatch(idsNoEnCache)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            response.data.forEach(usuario => {
              this.fotosPerfilCache.set(usuario.id, usuario.foto_perfil_url);
            });
          }
        },
        error: () => {}
      });
  }

  private obtenerFotoPerfil(usuarioId: number): string | null {
    if (this.fotosPerfilCache.has(usuarioId)) {
      return this.fotosPerfilCache.get(usuarioId) || null;
    }
    
    this.fotosService.obtenerFotoPerfil(usuarioId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.fotosPerfilCache.set(usuarioId, response.data.foto_perfil_url);
          }
        },
        error: () => {
          this.fotosPerfilCache.set(usuarioId, null);
        }
      });

    return null;
  }

  cargarComentarios(postId: number): void {
    const post = this.posts.find(p => p.id === postId);
    if (!post || post.commentsLoaded || post.loadingComments) return;

    post.loadingComments = true;

    this.comentariosService.obtenerPorPublicacion(postId, 50, 0)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (comentarios) => {
          if (Array.isArray(comentarios) && comentarios.length > 0) {
            const usuariosComentarios = [...new Set(comentarios.map(c => c.usuario_id))];
            this.cargarFotosPerfilBatch(usuariosComentarios);

            post.comments = comentarios.map(c => {
              const fotoPerfil = this.obtenerFotoPerfil(c.usuario_id);
              
              return {
                id: c.id,
                author: c.nombre_completo || c.nombre_usuario || 'Usuario',
                avatar: this.obtenerIniciales(c.nombre_completo || c.nombre_usuario || 'U'),
                text: c.texto,
                time: this.formatearTiempo(c.fecha_creacion),
                avatarColor: this.generarColorAvatar(c.usuario_id),
                usuario_id: c.usuario_id,
                foto_perfil_url: fotoPerfil,
                usandoIniciales: !fotoPerfil
              };
            });
            post.totalComments = comentarios.length;
          } else {
            post.comments = [];
            post.totalComments = 0;
          }

          post.commentsLoaded = true;
          post.loadingComments = false;
        },
        error: () => {
          post.comments = [];
          post.commentsLoaded = true;
          post.loadingComments = false;
        }
      });
  }

  toggleComments(postId: number): void {
    const post = this.posts.find(p => p.id === postId);
    if (!post) return;
    
    post.showComments = !post.showComments;
    
    if (post.showComments && !post.commentsLoaded && !post.loadingComments) {
      this.cargarComentarios(postId);
    }
  }

  addComment(postId: number): void {
    const text = this.commentInputs[postId]?.trim();
    if (!text) return;

    this.comentariosService.crear({ publicacion_id: postId, texto: text })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            const post = this.posts.find(p => p.id === postId);
            if (post) {
              let fotoPerfilUrl: string | null = null;
              
              if (res.data.foto_perfil_url) {
                fotoPerfilUrl = this.normalizarUrlFotoPerfil(res.data.foto_perfil_url);
              } else if (res.data.foto_perfil_s3) {
                fotoPerfilUrl = this.normalizarUrlFotoPerfil(res.data.foto_perfil_s3);
              }
              
              if (fotoPerfilUrl && res.data.usuario_id) {
                this.fotosPerfilCache.set(res.data.usuario_id, fotoPerfilUrl);
              }
              
              post.comments.unshift({
                id: res.data.id,
                author: res.data.nombre_completo || res.data.nombre_usuario || 'Tú',
                avatar: this.obtenerIniciales(res.data.nombre_completo || res.data.nombre_usuario || 'TU'),
                text: res.data.texto,
                time: 'Ahora',
                avatarColor: this.generarColorAvatar(res.data.usuario_id),
                usuario_id: res.data.usuario_id,
                foto_perfil_url: fotoPerfilUrl,
                usandoIniciales: !fotoPerfilUrl
              });
              
              this.commentInputs[postId] = '';
              post.totalComments = (post.totalComments || 0) + 1;

              const censura = (res as any).censura;
              
              if (censura && censura.fue_censurado) {
                this.mostrarAlertaCensura(postId, censura);
              }
            }
          }
        },
        error: (error) => {
          if (error.status === 401) {
            alert('Debes iniciar sesión para comentar');
          } else {
            alert('Error al publicar el comentario. Intenta de nuevo.');
          }
        }
      });
  }

  private mostrarAlertaCensura(postId: number, censura: any): void {
    this.comentarioCensuradoMensaje[postId] = censura.mensaje_usuario || 
      '💬 Tu comentario fue publicado con moderación automática.';
    
    this.nivelCensura[postId] = censura.nivel || 'bajo';
    this.mostrandoAlertaCensura[postId] = true;

    let duracion = 4000;
    
    switch (censura.nivel) {
      case 'bajo':
        duracion = 3000;
        break;
      case 'medio':
        duracion = 5000;
        break;
      case 'alto':
        duracion = 7000;
        break;
    }

    setTimeout(() => {
      this.mostrandoAlertaCensura[postId] = false;
      setTimeout(() => {
        delete this.comentarioCensuradoMensaje[postId];
        delete this.nivelCensura[postId];
      }, 500);
    }, duracion);
  }

  cerrarAlertaCensura(postId: number): void {
    this.mostrandoAlertaCensura[postId] = false;
    setTimeout(() => {
      delete this.comentarioCensuradoMensaje[postId];
      delete this.nivelCensura[postId];
    }, 500);
  }

  obtenerColorCensura(nivel: string): string {
    switch (nivel) {
      case 'bajo':
        return 'bg-blue-50 border-blue-300 text-blue-800 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-300';
      case 'medio':
        return 'bg-yellow-50 border-yellow-300 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-700 dark:text-yellow-300';
      case 'alto':
        return 'bg-red-50 border-red-300 text-red-800 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300';
      default:
        return 'bg-gray-50 border-gray-300 text-gray-800 dark:bg-gray-900/20 dark:border-gray-700 dark:text-gray-300';
    }
  }

  obtenerIconoCensura(nivel: string): string {
    switch (nivel) {
      case 'bajo':
        return '💬';case 'medio':
        return '⚠️';
      case 'alto':
        return '🚨';
      default:
        return '💬';
    }
  }

  eliminarComentario(postId: number, comentarioId: number): void {
    if (!confirm('¿Estás seguro de eliminar este comentario?')) return;

    this.comentariosService.eliminar(comentarioId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success) {
            const post = this.posts.find(p => p.id === postId);
            if (post) {
              post.comments = post.comments.filter(c => c.id !== comentarioId);
              post.totalComments = Math.max(0, (post.totalComments || 0) - 1);
            }
          }
        },
        error: () => alert('Error al eliminar el comentario')
      });
  }

  onCommentKeyPress(event: KeyboardEvent, postId: number): void {
    if (event.key === 'Enter') this.addComment(postId);
  }

  togglePostOptions(postId: number, event?: Event): void {
    event?.stopPropagation();
    
    this.posts.forEach(p => {
      if (p.id !== postId) p.showOptions = false;
    });
    
    const post = this.posts.find(p => p.id === postId);
    if (post) {
      post.showOptions = !post.showOptions;
    }
  }

  closePostOptions(): void {
    this.posts.forEach(p => p.showOptions = false);
  }

  ocultarPublicacion(postId: number, event?: Event): void {
    event?.stopPropagation();

    if (!this.autenticacionService.isAuthenticated()) {
      alert('Debes iniciar sesión para ocultar publicaciones');
      return;
    }

    const post = this.posts.find(p => p.id === postId);
    if (!post) return;

    const mensaje = post.usuarioId === this.usuarioActualId
      ? '¿Ocultar esta publicación? NADIE podrá verla (ni tú en el feed)'
      : '¿Ocultar esta publicación? Solo tú dejarás de verla';

    if (!confirm(mensaje)) return;

    this.ocultarLoading = true;
    this.closePostOptions();

    this.publicacionesOcultasService.ocultarPublicacion(postId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.ocultarLoading = false;

          if (response.success) {
            this.publicacionesOcultas.add(postId);
            
            const postElement = document.querySelector(`[data-post-id="${postId}"]`);
            if (postElement) {
              postElement.classList.add('animate-fade-out');
              setTimeout(() => {
                this.posts = this.posts.filter(p => p.id !== postId);
              }, 300);
            } else {
              this.posts = this.posts.filter(p => p.id !== postId);
            }

            alert(post.usuarioId === this.usuarioActualId
              ? '✅ Tu publicación ha sido ocultada. Podrás verla en "Mis publicaciones ocultas"'
              : '✅ Publicación ocultada. No volverá a aparecer en tu feed');
          } else {
            alert('Error al ocultar publicación: ' + (response.message || 'Error desconocido'));
          }
        },
        error: (error) => {
          this.ocultarLoading = false;
          
          if (error.status === 401) {
            alert('Debes iniciar sesión');
          } else {
            alert('Error al ocultar publicación. Intenta de nuevo.');
          }
        }
      });
  }

  openNoInteresaModal(postId: number, event?: Event): void {
    event?.stopPropagation();

    if (!this.autenticacionService.isAuthenticated()) {
      alert('Debes iniciar sesión para usar esta función');
      return;
    }

    const post = this.posts.find(p => p.id === postId);
    if (!post) return;

    if (post.usuarioId === this.usuarioActualId) {
      alert('No puedes marcar tus propias publicaciones como "No me interesa"');
      return;
    }

    this.noInteresaPostId = postId;
    this.showNoInteresaModal = true;
    this.noInteresaError = '';
    this.noInteresaSuccess = false;
    this.noInteresaLoading = false;
    this.closePostOptions();
    document.body.style.overflow = 'hidden';
  }

  closeNoInteresaModal(): void {
    this.showNoInteresaModal = false;
    this.noInteresaPostId = null;
    this.noInteresaError = '';
    this.noInteresaSuccess = false;
    this.noInteresaLoading = false;
    document.body.style.overflow = 'auto';
  }

  submitNoInteresa(): void {
    if (!this.noInteresaPostId) {
      this.noInteresaError = 'Error: Publicación no seleccionada';
      return;
    }

    this.noInteresaLoading = true;
    this.noInteresaError = '';

    this.noMeInteresaService.marcarNoInteresa(this.noInteresaPostId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.noInteresaLoading = false;

          if (response.success) {
            this.noInteresaSuccess = true;

            this.publicacionesNoInteresan.add(this.noInteresaPostId!);

            const postElement = document.querySelector(`[data-post-id="${this.noInteresaPostId}"]`);
            if (postElement) {
              postElement.classList.add('animate-fade-out');
              setTimeout(() => {
                this.posts = this.posts.filter(p => p.id !== this.noInteresaPostId);
              }, 300);
            } else {
              this.posts = this.posts.filter(p => p.id !== this.noInteresaPostId);
            }

            setTimeout(() => {
              this.closeNoInteresaModal();
            }, 2000);
          } else {
            this.noInteresaError = response.message || response.mensaje || 'Error al marcar';
          }
        },
        error: (error) => {
          this.noInteresaLoading = false;

          if (error.status === 401) {
            this.noInteresaError = 'Debes iniciar sesión';
          } else if (error.error?.mensaje) {
            this.noInteresaError = error.error.mensaje;
          } else if (error.error?.message) {
            this.noInteresaError = error.error.message;
          } else {
            this.noInteresaError = 'Error al marcar como "No me interesa". Intenta de nuevo.';
          }
        }
      });
  }

  openReportModal(postId: number, event?: Event): void {
    event?.stopPropagation();
    
    const post = this.posts.find(p => p.id === postId);
    if (!post) return;

    if (post.usuarioId === this.usuarioActualId) {
      alert('No puedes reportar tus propias publicaciones');
      return;
    }

    if (!this.autenticacionService.isAuthenticated()) {
      alert('Debes iniciar sesión para reportar publicaciones');
      return;
    }

    this.reportPostId = postId;
    this.showReportModal = true;
    this.reportMotivo = '';
    this.reportDescripcion = '';
    this.reportError = '';
    this.reportSuccess = false;
    this.reportLoading = false;
    this.closePostOptions();
    document.body.style.overflow = 'hidden';
  }

  closeReportModal(): void {
    this.showReportModal = false;
    this.reportPostId = null;
    this.reportMotivo = '';
    this.reportDescripcion = '';
    this.reportError = '';
    this.reportSuccess = false;
    this.reportLoading = false;
    document.body.style.overflow = 'auto';
  }

  submitReport(): void {
    if (!this.reportPostId || !this.reportMotivo.trim()) {
      this.reportError = 'Debes seleccionar un motivo';
      return;
    }

    if (!this.reportesService.esMotivosValido(this.reportMotivo)) {
      this.reportError = 'Motivo inválido';
      return;
    }

    this.reportLoading = true;
    this.reportError = '';

    const reportRequest = {
      publicacionId: this.reportPostId,
      motivo: this.reportMotivo,
      descripcion: this.reportDescripcion.trim() || undefined
    };

    this.reportesService.crearReporte(reportRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.reportLoading = false;
          
          if (response.success) {
            this.reportSuccess = true;
            
            setTimeout(() => {
              this.closeReportModal();
            }, 2000);
          } else {
            this.reportError = response.message || response.mensaje || 'Error al crear el reporte';
          }
        },
        error: (error) => {
          this.reportLoading = false;
          
          if (error.status === 401) {
            this.reportError = 'Debes iniciar sesión';
          } else if (error.error?.mensaje) {
            this.reportError = error.error.mensaje;
          } else if (error.error?.message) {
            this.reportError = error.error.message;
          } else {
            this.reportError = 'Error al enviar el reporte. Intenta de nuevo.';
          }
        }
      });
  }

  obtenerMotivosValidos(): string[] {
    return this.reportesService.obtenerMotivosValidos();
  }

  openShareModal(postId: number, event?: Event): void {
    event?.stopPropagation();
    this.sharePostId = postId;
    this.showShareModal = true;
    this.linkCopied = false;
    this.closePostOptions();
    document.body.style.overflow = 'hidden';
  }

  closeShareModal(): void {
    this.showShareModal = false;
    this.sharePostId = null;
    document.body.style.overflow = 'auto';
  }

  shareToSocial(platform: string): void {
    const post = this.posts.find(p => p.id === this.sharePostId);
    if (!post) return;

    const url = `http://3.146.83.30:4200/principal/post/${post.id}`;
    const shareUrl = SHARE_URLS[platform]?.(url, post.content || '');

    if (shareUrl) {
      window.open(shareUrl, '_blank');
      post.shares++;
    }
  }

  copyLink(): void {
    const url = `http://3.146.83.30:4200/principal/post/${this.sharePostId}`;
    navigator.clipboard.writeText(url).then(() => {
      this.linkCopied = true;
      setTimeout(() => this.linkCopied = false, 2000);
    });
  }

  openCreateModal(): void {
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  openPostDetail(postId: number): void {
    const post = this.posts.find(p => p.id === postId);
    if (!post) return;

    this.selectedPost = post;
    this.showPostDetailModal = true;
    this.closePostOptions();
    document.body.style.overflow = 'hidden';

    if (!post.commentsLoaded && !post.loadingComments) {
      this.cargarComentarios(postId);
    }
  }

  closePostDetail(): void {
    this.showPostDetailModal = false;
    this.selectedPost = null;
    document.body.style.overflow = 'auto';
  }

  private cargarDatosUsuarioActual(): void {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        this.usuarioActual = JSON.parse(userStr);
        
        if (this.usuarioActual?.id) {
          this.cargarFotosPerfilBatch([this.usuarioActual.id]);
        }
      } catch (error) {}
    }
  }

  private cargarUsuariosActivosEstatico(): void {
    this.usuariosActivos = [
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
    ];
  }

  filtrarPorCategoria(categoria: string): void {
    this.categoriaSeleccionada = 
      this.categoriaSeleccionada === categoria ? null : categoria;
  }

  get postsFiltrados(): Post[] {
    if (!this.categoriaSeleccionada) {
      return this.posts;
    }
    
    const filtrados = this.posts.filter(post =>
      post.category.toLowerCase() === this.categoriaSeleccionada!.toLowerCase()
    );
    
    return filtrados;
  }

  seguirUsuario(usuarioId: number): void {
    if (!this.autenticacionService.isAuthenticated()) {
      alert('Debes iniciar sesión para seguir usuarios');
      return;
    }

    this.seguidorService.seguir(usuarioId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.seguidosIds.add(usuarioId);
            
            setTimeout(() => {
              if (this.sidebarSugerencias) {
                this.sidebarSugerencias.recargarSugerencias();
              }
            }, 1000);
            
            alert('✅ Ahora sigues a este usuario');
          } else {
            alert('Error al seguir usuario: ' + (response.message || 'Intenta de nuevo'));
          }
        },
        error: (error) => {
          if (error.status === 401) {
            alert('Debes iniciar sesión');
          } else if (error.error?.mensaje) {
            alert(error.error.mensaje);
          } else {
            alert('Error al seguir usuario. Intenta de nuevo.');
          }
        }
      });
  }

  onSugerenciasCargadas(cantidad: number): void {}

  public obtenerUsuarioActualId(): number | null {
    const user = localStorage.getItem('currentUser');
    if (!user) return null;
    try {
      return JSON.parse(user).id;
    } catch {
      return null;
    }
  }

  public obtenerIniciales(nombre: string): string {
    if (!nombre) return 'U';
    const palabras = nombre.trim().split(' ');
    return palabras.length >= 2
      ? (palabras[0][0] + palabras[1][0]).toUpperCase()
      : nombre.substring(0, 2).toUpperCase();
  }

  public formatearTiempo(fecha: string): string {
    const diff = Date.now() - new Date(fecha).getTime();
    const min = Math.floor(diff / 60000);
    const hrs = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (min < 1) return 'Ahora';
    if (min < 60) return `Hace ${min} min`;
    if (hrs < 24) return `Hace ${hrs} h`;
    if (days < 7) return `Hace ${days} d`;

    return new Date(fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }

  private normalizarUrlImagen(url: string): string | null {
    if (!url || url.includes('/undefined')) return null;
    
    if (url.includes('s3.us-east-2.amazonaws.com') || url.includes('s3.amazonaws.com')) {
      return url;
    }
    
    if (url.startsWith('http')) {
      return url;
    }
    
    if (url.startsWith('/uploads/')) {
      return `${this.apiBaseUrl}${url}`;
    }
    
    if (!url.includes('/')) {
      return `${this.apiBaseUrl}/uploads/publicaciones/${url}`;
    }
    
    if (this.apiBaseUrl) {
      return `${this.apiBaseUrl}${url}`;
    }
    
    return url;
  }

  private normalizarUrlFotoPerfil(url: string): string | null {
    if (!url || url.includes('/undefined')) {
      return null;
    }
    
    if (url.includes('s3.us-east-2.amazonaws.com') || url.includes('s3.amazonaws.com')) {
      const urlCorregida = url.replace('/perfiles/', '/perfil/');
      return urlCorregida;
    }
    
    if (url.startsWith('http://') || url.startsWith('https://')) {
      const match = url.match(/\/uploads\/.+$/);
      if (match) {
        const rutaCorregida = match[0].replace('/perfiles/', '/perfil/');
        const urlCompleta = `${this.s3BaseUrl}${rutaCorregida}`;
        return urlCompleta;
      }
    }
    
    if (url.startsWith('perfiles/') || url.startsWith('perfil/')) {
      const rutaCorregida = url.replace('perfiles/', 'perfil/');
      const urlCompleta = `${this.s3BaseUrl}/uploads/${rutaCorregida}`;
      return urlCompleta;
    }
    
    if (url.startsWith('/uploads/')) {
      const rutaCorregida = url.replace('/perfiles/', '/perfil/');
      const urlCompleta = `${this.s3BaseUrl}${rutaCorregida}`;
      return urlCompleta;
    }
    
    if (!url.includes('/')) {
      const urlCompleta = `${this.s3BaseUrl}/uploads/perfil/${url}`;
      return urlCompleta;
    }
    
    const rutaCorregida = url.replace(/^\/+/, '').replace('/perfiles/', '/perfil/');
    const urlCompleta = `${this.s3BaseUrl}/${rutaCorregida}`;
    return urlCompleta;
  }

  public generarColorAvatar(id: number): string {
    return AVATAR_COLORS[id % AVATAR_COLORS.length];
  }

  getThemeRingColor(): string {
    return THEME_COLORS[this.currentTheme.id] || '#f97316';
  }

  get currentThemeData(): Theme {
    return this.currentTheme;
  }

  private cargarDatosEjemplo(): void {
    this.posts = [{
      id: 1,
      author: 'María Rodríguez',
      avatar: 'MR',
      time: 'Hace 2 horas',
      content: '¡Hola compañeros! Les comparto mi experiencia con el proyecto final de Desarrollo Web. 💻✨',
      image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=500&fit=crop',
      category: 'Tecnología',
      categoryColor: 'bg-teal-500',
      likes: 127,
      liked: false,
      shares: 8,
      avatarColor: AVATAR_COLORS[0],
      showComments: false,
      comments: [],
      loadingComments: false,
      commentsLoaded: false,
      totalComments: 5,
      likeLoading: false,
      showOptions: false
    }];
  }

  estaOculta(postId: number): boolean {
    return this.publicacionesOcultas.has(postId);
  }

  esNoInteresa(postId: number): boolean {
    return this.publicacionesNoInteresan.has(postId);
  }

  async refrescarFeed(): Promise<void> {
    await this.cargarMarcasUsuario();
    await this.cargarFeed();
  }

  trackByPostId(index: number, post: Post): number {
    return post.id;
  }

  trackByCommentId(index: number, comment: Comment): number {
    return comment.id;
  }

  trackByUserId(index: number, user: User): number {
    return user.id;
  }

  formatearTamanoArchivo(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  obtenerExtensionArchivo(nombreArchivo: string): string {
    const extension = nombreArchivo.split('.').pop()?.toUpperCase();
    return extension || 'FILE';
  }

  descargarDocumento(url: string, nombreArchivo: string): void {
    const link = document.createElement('a');
    link.href = url;
    link.download = nombreArchivo;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}