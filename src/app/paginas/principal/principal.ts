import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { DetallePost } from '../../componentes/detalle-post/detalle-post';
import { NavbarComponent } from '../../componentes/navbar/navbar';
import { AutenticacionService } from '../../core/servicios/autenticacion/autenticacion';
import { ComentariosService } from '../../core/servicios/comentarios/comentarios';
import { LikesService } from '../../core/servicios/likes/likes';
import { Publicacion, PublicacionesService } from '../../core/servicios/publicaciones/publicaciones';
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
  twitter: (url, text) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  linkedin: (url) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  telegram: (url, text) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  email: (url, text) => `mailto:?subject=${encodeURIComponent('Mira esta publicación')}&body=${encodeURIComponent(text + '\n\n' + url)}`
};

@Component({
  selector: 'app-principal',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, DetallePost],
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
  selectedPost: Post | null = null;
  sharePostId: number | null = null;
  isLoading = true;
  errorMessage = '';
  linkCopied = false;

  // ========== FORM STATE ==========
  commentInputs: { [key: number]: string } = {};
  searchQuery = '';
  selectedTab: 'redes' | 'usuarios' = 'redes';
  selectedUsers: number[] = [];

  // ========== PRIVADO ==========
  private seguidosIds = new Set<number>();
  private themeSubscription?: Subscription;
  public readonly apiBaseUrl = window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : 'http://3.146.83.30:3000';

  constructor(
    private themeService: ThemeService,
    private publicacionesService: PublicacionesService,
    private seguidorService: SeguidorService,
    private comentariosService: ComentariosService,
    private likesService: LikesService,
    private autenticacionService: AutenticacionService
  ) {
    this.currentTheme = this.themeService.getCurrentTheme();
  }

  // ========== LIFECYCLE HOOKS ==========
  ngOnInit(): void {
    this.themeSubscription = this.themeService.currentTheme$.subscribe(theme => {
      this.currentTheme = theme;
    });

    this.usuarioActualId = this.obtenerUsuarioActualId();
    this.inicializarFeed();
  }

  ngOnDestroy(): void {
    this.themeSubscription?.unsubscribe();
  }

  // ========== INICIALIZACIÓN ==========
  private async inicializarFeed(): Promise<void> {
    this.isLoading = true;
    try {
      await this.cargarSeguidos();
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

  private cargarSeguidos(): Promise<void> {
    return new Promise(resolve => {
      if (!this.usuarioActualId) return resolve();
      this.seguidorService.listarSeguidos(this.usuarioActualId).subscribe({
        next: (res) => {
          this.seguidosIds = new Set(res.seguidos?.map(u => u.id) || []);
          resolve();
        },
        error: () => resolve()
      });
    });
  }

  private cargarFeed(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.publicacionesService.obtenerPublicaciones().subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.posts = this.organizarPosts(this.convertirPublicacionesAPosts(res.data));
          }
          resolve();
        },
        error: (err) => {
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

  private convertirPublicacionesAPosts(pubs: Publicacion[]): Post[] {
    return pubs.map(p => {
      const pubAny = p as any;
      return {
        id: p.id,
        author: p.nombre_completo || p.nombre_usuario || 'Usuario',
        avatar: this.obtenerIniciales(p.nombre_completo || p.nombre_usuario || 'U'),
        time: this.formatearTiempo(p.fecha_creacion),
        content: p.contenido,
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
        likeLoading: false
      };
    });
  }

  private cargarUsuarios(): void {
    if (!this.usuarioActualId) return;
    this.seguidorService.listarSeguidos(this.usuarioActualId).subscribe({
      next: (res) => {
        this.users = (res.seguidos || []).map(u => ({
          id: u.id,
          name: u.nombre_completo,
          username: '@' + u.nombre_usuario,
          avatar: this.obtenerIniciales(u.nombre_completo),
          avatarColor: this.generarColorAvatar(u.id),
          isFollowing: true
        }));
      },
      error: (err) => console.error('❌ Error al cargar usuarios:', err)
    });
  }

  // ========== LIKES ==========
  private verificarLikesDelUsuario(): void {
    this.posts.forEach(post => {
      this.likesService.verificarLike(post.id).subscribe({
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

    this.likesService.toggleLike(postId).subscribe({
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
    this.comentariosService.obtenerPorPublicacion(postId, 50, 0).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          post.comments = res.data.map(c => ({
            id: c.id,
            author: c.nombre_completo || c.nombre_usuario || 'Usuario',
            avatar: this.obtenerIniciales(c.nombre_completo || c.nombre_usuario || 'U'),
            text: c.texto,
            time: this.formatearTiempo(c.fecha_creacion),
            avatarColor: this.generarColorAvatar(c.usuario_id),
            usuario_id: c.usuario_id
          }));
          post.commentsLoaded = true;
          post.totalComments = res.pagination?.total || res.data.length;
        }
        post.loadingComments = false;
      },
      error: () => post.loadingComments = false
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

    this.comentariosService.crear({ publicacion_id: postId, texto: text }).subscribe({
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

    this.comentariosService.eliminar(comentarioId).subscribe({
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

  // ========== COMPARTIR ==========
  openShareModal(postId: number, event?: Event): void {
    event?.stopPropagation();
    this.sharePostId = postId;
    this.showShareModal = true;
    this.searchQuery = '';
    this.selectedUsers = [];
    this.linkCopied = false;
    this.selectedTab = 'redes';
    document.body.style.overflow = 'hidden';
  }

  closeShareModal(): void {
    this.showShareModal = false;
    this.sharePostId = null;
    document.body.style.overflow = 'auto';
  }

  switchShareTab(tab: 'redes' | 'usuarios'): void {
    this.selectedTab = tab;
    this.searchQuery = '';
  }

  shareToSocial(platform: string): void {
    const post = this.posts.find(p => p.id === this.sharePostId);
    if (!post) return;

    const url = `https://redstudent.com/post/${post.id}`;
    const shareUrl = SHARE_URLS[platform]?.(url, post.content || '');

    if (shareUrl) {
      window.open(shareUrl, '_blank');
      post.shares++;
    }
  }

  copyLink(): void {
    const url = `https://redstudent.com/post/${this.sharePostId}`;
    navigator.clipboard.writeText(url).then(() => {
      this.linkCopied = true;
      setTimeout(() => this.linkCopied = false, 2000);
    });
  }

  sendToUsers(): void {
    if (this.selectedUsers.length === 0) return;
    const post = this.posts.find(p => p.id === this.sharePostId);
    if (post) post.shares += this.selectedUsers.length;
    alert(`Publicación compartida con ${this.selectedUsers.length} usuario(s)`);
    this.closeShareModal();
  }

  toggleUserSelection(userId: number): void {
    const i = this.selectedUsers.indexOf(userId);
    i > -1 ? this.selectedUsers.splice(i, 1) : this.selectedUsers.push(userId);
  }

  isUserSelected(userId: number): boolean {
    return this.selectedUsers.includes(userId);
  }

  onShareBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('share-modal-backdrop')) {
      this.closeShareModal();
    }
  }

  get filteredUsers(): User[] {
    if (!this.searchQuery.trim()) return this.users;
    const q = this.searchQuery.toLowerCase();
    return this.users.filter(u =>
      u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q)
    );
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
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${this.apiBaseUrl}${url.startsWith('/') ? url : '/' + url}`;
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
      likeLoading: false
    }];
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