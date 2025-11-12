import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
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

// ========== INTERFACES ==========
interface Comment {
  id: number;
  author: string;
  avatar: string;
  text: string;
  time: string;
  avatarColor: string;
  usuario_id?: number;
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
}

interface User {
  id: number;
  name: string;
  username: string;
  avatar: string;
  avatarColor: string;
  isFollowing: boolean;
}

// ========== CONSTANTES ==========
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
  twitter: (url, text) => `https://twitter.twitter/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  linkedin: (url) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  telegram: (url, text) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  email: (url, text) => `mailto:?subject=${encodeURIComponent('Mira esta publicación')}&body=${encodeURIComponent(text + '\n\n' + url)}`
};

@Component({
  selector: 'app-principal',
  standalone: true,
  imports: [CommonModule, FormsModule, Navbar, DetallePost],
  templateUrl: './principal.html',
  styleUrls: ['./principal.css']
})
export class Principal implements OnInit, OnDestroy {
  // ========== ESTADO ==========
  posts: Post[] = [];
  users: User[] = [];
  currentTheme!: Theme;
  usuarioActualId: number | null = null;

  // ========== UI STATE ==========
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

  // ========== FORM STATE ==========
  commentInputs: { [key: number]: string } = {};
selectedTab: 'redes' = 'redes';
  
  // ========== REPORTES ==========
  reportMotivo: string = '';
  reportDescripcion: string = '';
  reportLoading = false;
  reportSuccess = false;
  reportError = '';

  // ========== NO ME INTERESA ==========
  noInteresaLoading = false;
  noInteresaSuccess = false;
  noInteresaError = '';
  
  // ========== OCULTAR ==========
  ocultarLoading = false;

  // ========== CACHE LOCAL ==========
  publicacionesOcultas = new Set<number>();
  publicacionesNoInteresan = new Set<number>();

  // ========== PRIVADO ==========
  private seguidosIds = new Set<number>();
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
    private route: ActivatedRoute
  ) {
    this.currentTheme = this.themeService.getCurrentTheme();
  }

  // ========== LIFECYCLE HOOKS ==========
  ngOnInit(): void {
  this.themeSubscription = this.themeService.currentTheme$
    .pipe(takeUntil(this.destroy$))
    .subscribe(theme => {
      this.currentTheme = theme;
    });

  this.usuarioActualId = this.obtenerUsuarioActualId();
  this.inicializarFeed();

  // ✅ DETECTAR parámetro de post en la URL
  this.route.params
    .pipe(takeUntil(this.destroy$))
    .subscribe(params => {
      const postId = params['id'];
      if (postId) {
        console.log('📍 Post ID detectado en URL:', postId);
        this.abrirPostDesdeURL(Number(postId));
      }
    });
}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ========== INICIALIZACIÓN ==========
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
      console.error('❌ Error al inicializar feed:', error);
      this.errorMessage = 'Error al cargar el contenido';
      this.cargarDatosEjemplo();
    } finally {
      this.isLoading = false;
    }
  }

  private cargarMarcasUsuario(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.autenticacionService.isAuthenticated()) {
        console.log('⚠️ Usuario no autenticado, saltando carga de marcas');
        return resolve();
      }

      let completadas = 0;
      const total = 2;

      const verificarCompleto = () => {
        completadas++;
        if (completadas === total) resolve();
      };

      // Cargar publicaciones ocultas
      this.publicacionesOcultasService.obtenerPublicacionesOcultas()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success && Array.isArray(response.data)) {
              this.publicacionesOcultas = new Set(
                response.data.map(p => p.id)
              );
              console.log('✅ Publicaciones ocultas cargadas:', this.publicacionesOcultas.size);
            }
            verificarCompleto();
          },
          error: (error) => {
            console.error('❌ Error al cargar publicaciones ocultas:', error);
            verificarCompleto();
          }
        });

      // Cargar publicaciones "No me interesa"
      this.noMeInteresaService.obtenerPublicacionesNoInteresan()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success && Array.isArray(response.data)) {
              this.publicacionesNoInteresan = new Set(
                response.data.map(p => p.id)
              );
              console.log('✅ Publicaciones "No me interesa" cargadas:', this.publicacionesNoInteresan.size);
            }
            verificarCompleto();
          },
          error: (error) => {
            console.error('❌ Error al cargar publicaciones "No me interesa":', error);
            verificarCompleto();
          }
        });
    });
  }


  /**
 * Abrir modal de detalle de post cuando se accede desde URL directa
 */
private abrirPostDesdeURL(postId: number): void {
  // Función recursiva que espera hasta que los posts estén cargados
  const intentarAbrir = (intentos = 0) => {
    if (intentos > 20) {
      console.error('❌ Timeout: No se pudo cargar el post', postId);
      return;
    }

    const post = this.posts.find(p => p.id === postId);
    
    if (post) {
      console.log('✅ Post encontrado, abriendo detalle:', postId);
      // Pequeño delay para asegurar que el DOM esté listo
      setTimeout(() => {
        this.openPostDetail(postId);
      }, 100);
    } else if (!this.isLoading) {
      // Si ya terminó de cargar y no encontró el post
      console.warn('⚠️ Post no encontrado en el feed:', postId);
    } else {
      // Reintentar después de 200ms
      setTimeout(() => intentarAbrir(intentos + 1), 200);
    }
  };

  intentarAbrir();
}

  private cargarFeed(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('🔄 Iniciando carga de feed...');
      
      this.publicacionesService.obtenerPublicaciones()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            console.log('📦 Respuesta obtenerPublicaciones:', {
              success: res.success,
              dataType: typeof res.data,
              isArray: Array.isArray(res.data),
              cantidad: Array.isArray(res.data) ? res.data.length : 'N/A',
              message: res.message
            });

            if (!res.success) {
              console.warn('⚠️ Respuesta no exitosa:', res.message);
              this.posts = [];
              this.cargarDatosEjemplo();
              return resolve();
            }

            if (!Array.isArray(res.data)) {
              console.warn('⚠️ res.data no es un array:', {
                tipo: typeof res.data,
                valor: res.data
              });
              this.posts = [];
              this.cargarDatosEjemplo();
              return resolve();
            }

            if (res.data.length === 0) {
              console.log('ℹ️ Sin publicaciones disponibles');
              this.posts = [];
              return resolve();
            }

            try {
              console.log('✅ Convirtiendo', res.data.length, 'publicaciones...');
              
              // Filtrar publicaciones ocultas y marcadas "No me interesa"
              const publicacionesFiltradas = res.data.filter(pub => {
                const estaOculta = this.publicacionesOcultas.has(pub.id);
                const noInteresa = this.publicacionesNoInteresan.has(pub.id);
                
                if (estaOculta) {
                  console.log(`🚫 Publicación ${pub.id} oculta - No se mostrará`);
                }
                if (noInteresa) {
                  console.log(`👎 Publicación ${pub.id} marcada como "No me interesa" - No se mostrará`);
                }
                
                return !estaOculta && !noInteresa;
              });

              console.log(`📊 Publicaciones filtradas: ${res.data.length} → ${publicacionesFiltradas.length}`);

              const postsConvertidos = this.convertirPublicacionesAPosts(publicacionesFiltradas);
              this.posts = this.organizarPosts(postsConvertidos);
              
              console.log('✅ Feed cargado correctamente:', {
                totalPosts: this.posts.length,
                categorias: [...new Set(this.posts.map(p => p.category))]
              });
            } catch (error) {
              console.error('❌ Error al procesar publicaciones:', error);
              this.posts = [];
              this.cargarDatosEjemplo();
            }

            resolve();
          },
          error: (err) => {
            console.error('❌ Error HTTP al cargar feed:', {
              status: err.status,
              statusText: err.statusText,
              message: err.message,
              url: err.url
            });
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
    if (!Array.isArray(pubs)) {
      console.warn('⚠️ convertirPublicacionesAPosts recibió no-array:', typeof pubs);
      return [];
    }

    if (pubs.length === 0) {
      console.log('ℹ️ Array de publicaciones vacío');
      return [];
    }

    console.log('🔄 Convirtiendo', pubs.length, 'publicaciones a formato Post...');

    return pubs.map((p, index) => {
      try {
        const pubAny = p as any;
        
        if (!p.id || !p.usuario_id) {
          console.warn(`⚠️ Publicación ${index} sin datos críticos:`, p);
          return null;
        }

        const postConvertido: Post = {
          id: p.id,
          author: p.nombre_completo || p.nombre_usuario || 'Usuario',
          avatar: this.obtenerIniciales(p.nombre_completo || p.nombre_usuario || 'U'),
          time: this.formatearTiempo(p.fecha_creacion),
          content: p.contenido || '',
          image: this.normalizarUrlImagen(p.imagen_s3 || p.imagen_url || ''),
          category: p.categoria || 'General',
          categoryColor: p.color_categoria || this.publicacionesService.obtenerColorCategoria(p.categoria || 'General'),
          likes: pubAny.total_likes || 0,
          liked: false,
          shares: pubAny.total_compartidos || 0,
          avatarColor: this.generarColorAvatar(p.usuario_id),
          comments: [],
          showComments: false,
          usuarioId: p.usuario_id,
          loadingComments: false,
          commentsLoaded: false,
          totalComments: pubAny.total_comentarios || 0,
          likeLoading: false,
          showOptions: false
        };

        return postConvertido;
      } catch (error) {
        console.error(`❌ Error convirtiendo publicación ${index}:`, error, p);
        return null;
      }
    }).filter(p => p !== null) as Post[];
  }

  private cargarSeguidos(): Promise<void> {
    return new Promise(resolve => {
      if (!this.usuarioActualId) {
        console.log('⚠️ No hay usuario actual, saltando carga de seguidos');
        return resolve();
      }

      console.log('👥 Cargando seguidos del usuario:', this.usuarioActualId);

      this.seguidorService.listarSeguidos(this.usuarioActualId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            console.log('📦 Respuesta listarSeguidos:', response);

            if (response.success && response.data && response.data.seguidos) {
              this.seguidosIds = new Set(response.data.seguidos.map(u => u.id));
              console.log('✅ Seguidos cargados:', this.seguidosIds.size);
            } else {
              console.warn('⚠️ Respuesta sin seguidos:', response);
              this.seguidosIds = new Set();
            }

            resolve();
          },
          error: (error) => {
            console.error('❌ Error al cargar seguidos:', error);
            this.seguidosIds = new Set();
            resolve();
          }
        });
    });
  }

  private cargarUsuarios(): void {
    if (!this.usuarioActualId) {
      console.log('⚠️ No hay usuario actual, saltando carga de usuarios');
      return;
    }

    console.log('👥 Cargando lista de usuarios seguidos...');

    this.seguidorService.listarSeguidos(this.usuarioActualId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('📦 Respuesta usuarios seguidos:', response);

          if (!response.success) {
            console.warn('⚠️ Respuesta no exitosa');
            this.users = [];
            return;
          }

          if (!response.data) {
            console.warn('⚠️ response.data es null/undefined');
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

            console.log('✅ Usuarios cargados:', this.users.length);
          } else {
            console.log('ℹ️ Sin usuarios seguidos');
            this.users = [];
          }
        },
        error: (error) => {
          console.error('❌ Error al cargar usuarios:', {
            status: error.status,
            message: error.message
          });
          this.users = [];
        }
      });
  }

  // ========== LIKES ==========
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
          error: (error) => console.error(`❌ Error al verificar like del post ${post.id}:`, error)
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
        next: (response) => {
          if (response.success && response.data) {
            console.log('✅ Like actualizado:', response.data.liked);
          }
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

  // ========== COMENTARIOS ==========
  cargarComentarios(postId: number): void {
    const post = this.posts.find(p => p.id === postId);
    if (!post || post.commentsLoaded || post.loadingComments) return;

    post.loadingComments = true;
    
    console.log('📥 Cargando comentarios para post:', postId);

    this.comentariosService.obtenerPorPublicacion(postId, 50, 0)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (comentarios) => {
          console.log('✅ Comentarios recibidos:', comentarios.length);

          if (Array.isArray(comentarios) && comentarios.length > 0) {
            post.comments = comentarios.map(c => ({
              id: c.id,
              author: c.nombre_completo || c.nombre_usuario || 'Usuario',
              avatar: this.obtenerIniciales(c.nombre_completo || c.nombre_usuario || 'U'),
              text: c.texto,
              time: this.formatearTiempo(c.fecha_creacion),
              avatarColor: this.generarColorAvatar(c.usuario_id),
              usuario_id: c.usuario_id
            }));
            post.totalComments = comentarios.length;
          } else {
            console.log('ℹ️ Sin comentarios');
            post.comments = [];
            post.totalComments = 0;
          }

          post.commentsLoaded = true;
          post.loadingComments = false;
        },
        error: (error) => {
          console.error('❌ Error al cargar comentarios:', error);
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
    if (post.showComments && !post.commentsLoaded) {
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
              post.comments.unshift({
                id: res.data.id,
                author: res.data.nombre_completo || res.data.nombre_usuario || 'Tú',
                avatar: this.obtenerIniciales(res.data.nombre_completo || res.data.nombre_usuario || 'TU'),
                text: res.data.texto,
                time: 'Ahora',
                avatarColor: this.generarColorAvatar(res.data.usuario_id),
                usuario_id: res.data.usuario_id
              });
              this.commentInputs[postId] = '';
              post.totalComments = (post.totalComments || 0) + 1;
            }
          }
        },
        error: () => alert('Error al publicar el comentario')
      });
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

  // ========== MENÚ DE OPCIONES ==========
  togglePostOptions(postId: number, event?: Event): void {
    event?.stopPropagation();
    
    // Cerrar otros menús abiertos
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

  // ========== OCULTAR PUBLICACIÓN ==========
  ocultarPublicacion(postId: number, event?: Event): void {
    event?.stopPropagation();

    if (!this.autenticacionService.isAuthenticated()) {
      alert('Debes iniciar sesión para ocultar publicaciones');
      return;
    }

    const post = this.posts.find(p => p.id === postId);
    if (!post) return;

    // Confirmar acción
    const mensaje = post.usuarioId === this.usuarioActualId
      ? '¿Ocultar esta publicación? NADIE podrá verla (ni tú en el feed)'
      : '¿Ocultar esta publicación? Solo tú dejarás de verla';

    if (!confirm(mensaje)) return;

    this.ocultarLoading = true;
    this.closePostOptions();

    console.log('🚫 Ocultando publicación:', postId);

    this.publicacionesOcultasService.ocultarPublicacion(postId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.ocultarLoading = false;

          if (response.success) {
            console.log('✅ Publicación ocultada exitosamente');
            
            // Agregar a cache local
            this.publicacionesOcultas.add(postId);
            
            // Remover del feed con animación
            const postElement = document.querySelector(`[data-post-id="${postId}"]`);
            if (postElement) {
              postElement.classList.add('animate-fade-out');
              setTimeout(() => {
                this.posts = this.posts.filter(p => p.id !== postId);
              }, 300);
            } else {
              this.posts = this.posts.filter(p => p.id !== postId);
            }

            // Mostrar mensaje de éxito
            alert(post.usuarioId === this.usuarioActualId
              ? '✅ Tu publicación ha sido ocultada. Podrás verla en "Mis publicaciones ocultas"'
              : '✅ Publicación ocultada. No volverá a aparecer en tu feed');
          } else {
            alert('Error al ocultar publicación: ' + (response.message || 'Error desconocido'));
          }
        },
        error: (error) => {
          this.ocultarLoading = false;
          console.error('❌ Error al ocultar publicación:', error);
          
          if (error.status === 401) {
            alert('Debes iniciar sesión');
          } else {
            alert('Error al ocultar publicación. Intenta de nuevo.');
          }
        }
      });
  }

  // ========== NO ME INTERESA ==========
  openNoInteresaModal(postId: number, event?: Event): void {
    event?.stopPropagation();

    if (!this.autenticacionService.isAuthenticated()) {
      alert('Debes iniciar sesión para usar esta función');
      return;
    }

    const post = this.posts.find(p => p.id === postId);
    if (!post) return;

    // No permitir marcar propias publicaciones
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

    console.log('👎 Marcando como "No me interesa":', this.noInteresaPostId);

    this.noMeInteresaService.marcarNoInteresa(this.noInteresaPostId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.noInteresaLoading = false;

          if (response.success) {
            console.log('✅ Marcado como "No me interesa":', response.data);
            this.noInteresaSuccess = true;

            // Agregar a cache local
            this.publicacionesNoInteresan.add(this.noInteresaPostId!);

            // Remover del feed con animación
            const postElement = document.querySelector(`[data-post-id="${this.noInteresaPostId}"]`);
            if (postElement) {
              postElement.classList.add('animate-fade-out');
              setTimeout(() => {
                this.posts = this.posts.filter(p => p.id !== this.noInteresaPostId);
              }, 300);
            } else {
              this.posts = this.posts.filter(p => p.id !== this.noInteresaPostId);
            }

            // Cerrar modal después de 2 segundos
            setTimeout(() => {
              this.closeNoInteresaModal();
            }, 2000);
          } else {
            this.noInteresaError = response.message || response.mensaje || 'Error al marcar';
          }
        },
        error: (error) => {
          this.noInteresaLoading = false;
          console.error('❌ Error al marcar "No me interesa":', error);

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

  // ========== REPORTES ==========
  openReportModal(postId: number, event?: Event): void {
    event?.stopPropagation();
    
    const post = this.posts.find(p => p.id === postId);
    if (!post) return;

    // No permitir reportar propias publicaciones
    if (post.usuarioId === this.usuarioActualId) {
      alert('No puedes reportar tus propias publicaciones');
      return;
    }

    // Validar autenticación
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

    // Validar que el motivo sea válido
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

    console.log('📝 Enviando reporte:', reportRequest);

    this.reportesService.crearReporte(reportRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.reportLoading = false;
          
          if (response.success) {
            console.log('✅ Reporte creado exitosamente:', response.data);
            this.reportSuccess = true;
            
            setTimeout(() => {
              this.closeReportModal();
            }, 2000);
          } else {
            this.reportError = response.message || response.mensaje || 'Error al crear el reporte';
            console.error('❌ Error en respuesta:', this.reportError);
          }
        },
        error: (error) => {
          this.reportLoading = false;
          console.error('❌ Error al crear reporte:', error);
          
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

  // ========== COMPARTIR ==========
  openShareModal(postId: number, event?: Event): void {
    event?.stopPropagation();
    this.sharePostId = postId;
    this.showShareModal = true;

    this.linkCopied = false;
    this.selectedTab = 'redes';
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

  const url = `http://3.146.83.30:4200/principal/post/${post.id}`;  // ✅ ACTUALIZADO
  const shareUrl = SHARE_URLS[platform]?.(url, post.content || '');

  if (shareUrl) {
    window.open(shareUrl, '_blank');
    post.shares++;
  }
}

copyLink(): void {
  const url = `http://3.146.83.30:4200/principal/post/${this.sharePostId}`;  // ✅ ACTUALIZADO
  navigator.clipboard.writeText(url).then(() => {
    this.linkCopied = true;
    setTimeout(() => this.linkCopied = false, 2000);
  });
}


  onShareBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('share-modal-backdrop')) {
      this.closeShareModal();
    }
  }


  // ========== MODALS ==========
  openCreateModal(): void {
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  openPostDetail(postId: number): void {
    this.selectedPost = this.posts.find(p => p.id === postId) || null;
    this.showPostDetailModal = true;
    this.closePostOptions();
    document.body.style.overflow = 'hidden';
  }

  closePostDetail(): void {
    this.showPostDetailModal = false;
    this.selectedPost = null;
    document.body.style.overflow = 'auto';
  }

  // ========== UTILIDADES ==========
  private obtenerUsuarioActualId(): number | null {
    const user = localStorage.getItem('currentUser');
    if (!user) return null;
    try {
      return JSON.parse(user).id;
    } catch {
      return null;
    }
  }

  private obtenerIniciales(nombre: string): string {
    if (!nombre) return 'U';
    const palabras = nombre.trim().split(' ');
    return palabras.length >= 2
      ? (palabras[0][0] + palabras[1][0]).toUpperCase()
      : nombre.substring(0, 2).toUpperCase();
  }

  private formatearTiempo(fecha: string): string {
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
  
  // Si ya es URL completa de S3, devolverla tal cual
  if (url.includes('s3.us-east-2.amazonaws.com') || url.includes('s3.amazonaws.com')) {
    return url;
  }
  
  // Si es URL HTTP/HTTPS completa, devolverla
  if (url.startsWith('http')) {
    return url;
  }
  
  // Si es ruta relativa como /uploads/..., construir URL completa
  if (url.startsWith('/uploads/')) {
    return `${this.apiBaseUrl}${url}`;
  }
  
  // Si es solo nombre de archivo, asumimos que está en /uploads/publicaciones/
  if (!url.includes('/')) {
    return `${this.apiBaseUrl}/uploads/publicaciones/${url}`;
  }
  
  // Si es otra ruta relativa
  if (this.apiBaseUrl) {
    return `${this.apiBaseUrl}${url}`;
  }
  
  return url;
}

  private generarColorAvatar(id: number): string {
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
}