import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { DetallePost } from '../../componentes/detalle-post/detalle-post';
import { NavbarComponent } from '../../componentes/navbar/navbar';
import { Comentario, ComentariosService } from '../../core/servicios/comentarios/comentarios';
import { Publicacion, PublicacionesService } from '../../core/servicios/publicaciones/publicaciones';
import { SeguidorService } from '../../core/servicios/seguidores/seguidores';
import { Theme, ThemeService } from '../../core/servicios/temas';

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
}

interface User {
  id: number;
  name: string;
  username: string;
  avatar: string;
  avatarColor: string;
  isFollowing: boolean;
}

@Component({
  selector: 'app-principal',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, DetallePost],
  templateUrl: './principal.html',
  styleUrls: ['./principal.css']
})
export class Principal implements OnInit, OnDestroy {
  // ========== CONFIGURACIÓN API ==========
  public apiBaseUrl: string;

  showCreateModal = false;
  showPostDetailModal = false;
  selectedPost: Post | null = null;
  isLoading = true;
  errorMessage = '';

  // Variables para el modal de compartir
  showShareModal: boolean = false;
  sharePostId: number | null = null;
  searchQuery: string = '';
  selectedTab: 'redes' | 'usuarios' = 'redes';
  linkCopied: boolean = false;
  selectedUsers: number[] = [];

  // Tema actual
  currentTheme!: Theme;
  private themeSubscription?: Subscription;

  posts: Post[] = [];
  users: User[] = [];
  commentInputs: { [key: number]: string } = {};

  // IDs de seguimiento
  public usuarioActualId: number | null = null;
  private seguidosIds: Set<number> = new Set();

  constructor(
    private themeService: ThemeService,
    private publicacionesService: PublicacionesService,
    private seguidorService: SeguidorService,
    private comentariosService: ComentariosService
  ) {
    this.currentTheme = this.themeService.getCurrentTheme();
    
    // Configurar URL base según el entorno
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      this.apiBaseUrl = 'http://localhost:3000';
    } else {
      this.apiBaseUrl = 'http://13.59.190.199:3000';
    }
  }

  ngOnInit(): void {
    this.themeSubscription = this.themeService.currentTheme$.subscribe(theme => {
      this.currentTheme = theme;
      console.log('🎨 Tema actualizado en Principal:', theme.name);
    });
    
    this.usuarioActualId = this.obtenerUsuarioActualId();
    this.inicializarFeed();
  }

  ngOnDestroy(): void {
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
  }

  // ========== INICIALIZAR FEED ==========
  async inicializarFeed(): Promise<void> {
    this.isLoading = true;
    
    try {
      await this.cargarSeguidos();
      await this.cargarFeed();
      this.cargarUsuarios();
    } catch (error) {
      console.error('❌ Error al inicializar feed:', error);
      this.errorMessage = 'Error al cargar el contenido';
      this.isLoading = false;
      this.cargarDatosEjemplo();
    }
  }

  // ========== CARGAR SEGUIDOS ==========
  private cargarSeguidos(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.usuarioActualId) {
        console.log('⚠️ No hay usuario autenticado');
        resolve();
        return;
      }

      this.seguidorService.listarSeguidos(this.usuarioActualId).subscribe({
        next: (response) => {
          if (response.seguidos && Array.isArray(response.seguidos)) {
            this.seguidosIds = new Set(response.seguidos.map(u => u.id));
            console.log('✅ Seguidos cargados:', {
              total: response.total,
              ids: Array.from(this.seguidosIds)
            });
          }
          resolve();
        },
        error: (error) => {
          console.error('❌ Error al cargar seguidos:', error);
          resolve();
        }
      });
    });
  }

  // ========== CARGAR FEED ==========
  private cargarFeed(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.publicacionesService.obtenerPublicaciones().subscribe({
        next: (response) => {
          if (response.success && response.data) {
            const todasLasPublicaciones = this.convertirPublicacionesAPosts(response.data);
            
            const misPublicaciones: Post[] = [];
            const publicacionesSeguidos: Post[] = [];
            const publicacionesOtros: Post[] = [];
            
            todasLasPublicaciones.forEach(post => {
              if (post.usuarioId === this.usuarioActualId) {
                misPublicaciones.push(post);
              } else if (post.usuarioId && this.seguidosIds.has(post.usuarioId)) {
                publicacionesSeguidos.push(post);
              } else {
                publicacionesOtros.push(post);
              }
            });
            
            this.posts = this.mezclarPublicaciones(misPublicaciones, publicacionesSeguidos, publicacionesOtros);
            
            console.log('✅ Feed cargado:', {
              total: this.posts.length,
              mias: misPublicaciones.length,
              seguidos: publicacionesSeguidos.length,
              otros: publicacionesOtros.length
            });
          }
          this.isLoading = false;
          resolve();
        },
        error: (error) => {
          console.error('❌ Error al cargar feed:', error);
          this.errorMessage = 'Error al cargar las publicaciones';
          this.isLoading = false;
          this.cargarDatosEjemplo();
          reject(error);
        }
      });
    });
  }

  // ========== MEZCLAR PUBLICACIONES INTELIGENTEMENTE ==========
  private mezclarPublicaciones(mias: Post[], seguidos: Post[], otros: Post[]): Post[] {
    const resultado: Post[] = [];
    resultado.push(...mias.slice(0, 3));
    
    let indexSeguidos = 0;
    let indexOtros = 0;
    
    while (indexSeguidos < seguidos.length || indexOtros < otros.length) {
      for (let i = 0; i < 3 && indexSeguidos < seguidos.length; i++) {
        resultado.push(seguidos[indexSeguidos++]);
      }
      
      if (indexOtros < otros.length) {
        resultado.push(otros[indexOtros++]);
      }
    }
    
    if (mias.length > 3) {
      resultado.push(...mias.slice(3));
    }
    
    return resultado;
  }

  // ========== CONVERTIR PUBLICACIONES ==========
  convertirPublicacionesAPosts(publicaciones: Publicacion[]): Post[] {
    return publicaciones.map(pub => ({
      id: pub.id,
      author: pub.nombre_completo || pub.nombre_usuario || 'Usuario',
      avatar: this.obtenerIniciales(pub.nombre_completo || pub.nombre_usuario || 'U'),
      time: this.formatearTiempo(pub.fecha_creacion),
      content: pub.contenido,
      image: pub.imagen_s3 || pub.imagen_url ? this.normalizarUrlImagen(pub.imagen_s3 || pub.imagen_url || '') : null,
      category: pub.categoria || 'General',
      categoryColor: pub.color_categoria || this.publicacionesService.obtenerColorCategoria(pub.categoria || 'General'),
      likes: 0,
      liked: false,
      shares: 0,
      avatarColor: this.generarColorAvatar(pub.usuario_id),
      comments: [],
      showComments: false,
      usuarioId: pub.usuario_id,
      loadingComments: false,
      commentsLoaded: false
    }));
  }

  // ========== NORMALIZAR URL DE IMAGEN ==========
  private normalizarUrlImagen(url: string): string {
    if (!url) return '';
    
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    const urlLimpia = url.startsWith('/') ? url : '/' + url;
    return `${this.apiBaseUrl}${urlLimpia}`;
  }

  // ========== CARGAR USUARIOS ==========
  cargarUsuarios(): void {
    if (!this.usuarioActualId) return;

    this.seguidorService.listarSeguidos(this.usuarioActualId).subscribe({
      next: (response) => {
        if (response.seguidos && Array.isArray(response.seguidos)) {
          this.users = response.seguidos.map(usuario => ({
            id: usuario.id,
            name: usuario.nombre_completo,
            username: '@' + usuario.nombre_usuario,
            avatar: this.obtenerIniciales(usuario.nombre_completo),
            avatarColor: this.generarColorAvatarClase(usuario.id),
            isFollowing: true
          }));
          console.log('✅ Usuarios para compartir cargados:', this.users.length);
        }
      },
      error: (error) => {
        console.error('❌ Error al cargar usuarios:', error);
      }
    });
  }

  // ========== GESTIÓN DE COMENTARIOS ==========

  /**
   * Cargar comentarios de una publicación
   */
  cargarComentarios(postId: number): void {
    const post = this.posts.find(p => p.id === postId);
    if (!post || post.commentsLoaded || post.loadingComments) return;

    post.loadingComments = true;

    this.comentariosService.obtenerPorPublicacion(postId, 50, 0).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          post.comments = this.convertirComentariosAComments(response.data);
          post.commentsLoaded = true;
          console.log(`✅ Comentarios cargados para post ${postId}:`, post.comments.length);
        }
        post.loadingComments = false;
      },
      error: (error) => {
        console.error(`❌ Error al cargar comentarios del post ${postId}:`, error);
        post.loadingComments = false;
      }
    });
  }

  /**
   * Convertir comentarios de la API a formato local
   */
  private convertirComentariosAComments(comentarios: Comentario[]): Comment[] {
    return comentarios.map(com => ({
      id: com.id,
      author: com.nombre_completo || com.nombre_usuario || 'Usuario',
      avatar: this.obtenerIniciales(com.nombre_completo || com.nombre_usuario || 'U'),
      text: com.texto,
      time: this.formatearTiempo(com.fecha_creacion),
      avatarColor: this.generarColorAvatar(com.usuario_id),
      usuario_id: com.usuario_id
    }));
  }

  /**
   * Toggle mostrar/ocultar comentarios
   */
  toggleComments(postId: number): void {
    const post = this.posts.find(p => p.id === postId);
    if (!post) return;

    post.showComments = !post.showComments;

    // Si se están mostrando y no se han cargado, cargarlos
    if (post.showComments && !post.commentsLoaded) {
      this.cargarComentarios(postId);
    }
  }

  /**
   * Agregar un nuevo comentario
   */
  addComment(postId: number): void {
    const text = this.commentInputs[postId]?.trim();
    if (!text) return;

    const post = this.posts.find(p => p.id === postId);
    if (!post) return;

    // Crear el comentario en el backend
    this.comentariosService.crear({
      publicacion_id: postId,
      texto: text
    }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Agregar el comentario localmente
          const nuevoComentario: Comment = {
            id: response.data.id,
            author: response.data.nombre_completo || response.data.nombre_usuario || 'Tú',
            avatar: this.obtenerIniciales(response.data.nombre_completo || response.data.nombre_usuario || 'TU'),
            text: response.data.texto,
            time: 'Ahora',
            avatarColor: this.generarColorAvatar(response.data.usuario_id),
            usuario_id: response.data.usuario_id
          };

          post.comments.unshift(nuevoComentario); // Agregar al inicio
          this.commentInputs[postId] = ''; // Limpiar input
          
          console.log('✅ Comentario agregado:', nuevoComentario);
        }
      },
      error: (error) => {
        console.error('❌ Error al crear comentario:', error);
        alert('Error al publicar el comentario. Por favor, intenta de nuevo.');
      }
    });
  }

  /**
   * Manejar comentario agregado desde el modal de detalle
   */
  handleCommentAdded(event: {postId: number, comment: string}): void {
    this.commentInputs[event.postId] = event.comment;
    this.addComment(event.postId);
  }

  /**
   * Manejar tecla Enter en input de comentario
   */
  onCommentKeyPress(event: KeyboardEvent, postId: number): void {
    if (event.key === 'Enter') {
      this.addComment(postId);
    }
  }

  /**
   * Eliminar comentario (si es del usuario actual)
   */
  eliminarComentario(postId: number, comentarioId: number): void {
    if (!confirm('¿Estás seguro de eliminar este comentario?')) return;

    this.comentariosService.eliminar(comentarioId).subscribe({
      next: (response) => {
        if (response.success) {
          const post = this.posts.find(p => p.id === postId);
          if (post) {
            post.comments = post.comments.filter(c => c.id !== comentarioId);
            console.log('✅ Comentario eliminado');
          }
        }
      },
      error: (error) => {
        console.error('❌ Error al eliminar comentario:', error);
        alert('Error al eliminar el comentario.');
      }
    });
  }

  // ========== HELPERS ==========
  obtenerUsuarioActualId(): number | null {
    const usuarioStr = localStorage.getItem('currentUser');
    if (usuarioStr) {
      try {
        const usuario = JSON.parse(usuarioStr);
        console.log('👤 Usuario actual:', usuario);
        return usuario.id;
      } catch (e) {
        console.error('Error al parsear usuario:', e);
        return null;
      }
    }
    return null;
  }

  obtenerIniciales(nombre: string): string {
    if (!nombre) return 'U';
    const palabras = nombre.trim().split(' ');
    if (palabras.length >= 2) {
      return (palabras[0][0] + palabras[1][0]).toUpperCase();
    }
    return nombre.substring(0, 2).toUpperCase();
  }

  formatearTiempo(fecha: string): string {
    const ahora = new Date();
    const fechaPost = new Date(fecha);
    const diferencia = ahora.getTime() - fechaPost.getTime();
    
    const minutos = Math.floor(diferencia / 60000);
    const horas = Math.floor(diferencia / 3600000);
    const dias = Math.floor(diferencia / 86400000);

    if (minutos < 1) return 'Ahora';
    if (minutos < 60) return `Hace ${minutos} min`;
    if (horas < 24) return `Hace ${horas} h`;
    if (dias < 7) return `Hace ${dias} d`;
    
    return fechaPost.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }

  generarColorAvatar(id: number): string {
    const colores = [
      'linear-gradient(to bottom right, #2dd4bf, #0d9488)',
      'linear-gradient(to bottom right, #f97316, #ea580c)',
      'linear-gradient(to bottom right, #a855f7, #9333ea)',
      'linear-gradient(to bottom right, #ec4899, #db2777)',
      'linear-gradient(to bottom right, #6366f1, #8b5cf6)',
      'linear-gradient(to bottom right, #3b82f6, #2563eb)',
      'linear-gradient(to bottom right, #10b981, #059669)',
      'linear-gradient(to bottom right, #fbbf24, #f59e0b)'
    ];
    return colores[id % colores.length];
  }

  generarColorAvatarClase(id: number): string {
    const colores = [
      'from-teal-400 to-teal-600',
      'from-orange-400 to-orange-600',
      'from-purple-400 to-purple-600',
      'from-pink-400 to-pink-600',
      'from-indigo-400 to-indigo-600',
      'from-blue-400 to-blue-600',
      'from-green-400 to-green-600',
      'from-yellow-400 to-yellow-600'
    ];
    return colores[id % colores.length];
  }

  cargarDatosEjemplo(): void {
    this.posts = [
      {
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
        avatarColor: 'linear-gradient(to bottom right, #2dd4bf, #0d9488)',
        showComments: false,
        comments: [],
        loadingComments: false,
        commentsLoaded: false
      }
    ];
  }

  // ========== ACCIONES DE POST ==========
  get currentThemeData(): Theme {
    return this.currentTheme;
  }

  getThemeRingColor(): string {
    const colorMap: { [key: string]: string } = {
      'default': '#f97316',
      'midnight': '#6366f1',
      'forest': '#10b981',
      'sunset': '#f59e0b',
      'ocean': '#0ea5e9',
      'rose': '#ec4899',
      'slate': '#64748b',
      'lavender': '#a78bfa',
      'neon': '#0ff',
      'toxic': '#84cc16',
      'candy': '#ec4899',
      'chaos': '#ff0000'
    };
    return colorMap[this.currentTheme.id] || '#f97316';
  }

  openCreateModal() {
    this.showCreateModal = true;
  }

  closeCreateModal() {
    this.showCreateModal = false;
  }

  openPostDetail(postId: number) {
    this.selectedPost = this.posts.find(p => p.id === postId) || null;
    this.showPostDetailModal = true;
    document.body.style.overflow = 'hidden';
  }

  closePostDetail() {
    this.showPostDetailModal = false;
    this.selectedPost = null;
    document.body.style.overflow = 'auto';
  }

  toggleLike(postId: number) {
    const post = this.posts.find(p => p.id === postId);
    if (post) {
      post.liked = !post.liked;
      post.likes = post.liked ? post.likes + 1 : post.likes - 1;
    }
  }

  // ========== FUNCIONES DE COMPARTIR ==========
  openShareModal(postId: number, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
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

  onShareBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('share-modal-backdrop')) {
      this.closeShareModal();
    }
  }

  switchShareTab(tab: 'redes' | 'usuarios'): void {
    this.selectedTab = tab;
    this.searchQuery = '';
  }

  get filteredUsers(): User[] {
    if (!this.searchQuery.trim()) {
      return this.users;
    }
    const query = this.searchQuery.toLowerCase();
    return this.users.filter(user =>
      user.name.toLowerCase().includes(query) ||
      user.username.toLowerCase().includes(query)
    );
  }

  toggleUserSelection(userId: number): void {
    const index = this.selectedUsers.indexOf(userId);
    if (index > -1) {
      this.selectedUsers.splice(index, 1);
    } else {
      this.selectedUsers.push(userId);
    }
  }

  isUserSelected(userId: number): boolean {
    return this.selectedUsers.includes(userId);
  }

  shareToSocial(platform: string): void {
    const post = this.posts.find(p => p.id === this.sharePostId);
    if (!post) return;

    const postUrl = `https://redstudent.com/post/${post.id}`;
    const text = post.content || '';

    let shareUrl = '';

    switch(platform) {
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + postUrl)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(postUrl)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(text)}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${encodeURIComponent('Mira esta publicación')}&body=${encodeURIComponent(text + '\n\n' + postUrl)}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank');
      post.shares += 1;
    }
  }

  copyLink(): void {
    const postUrl = `https://redstudent.com/post/${this.sharePostId}`;
    navigator.clipboard.writeText(postUrl).then(() => {
      this.linkCopied = true;
      setTimeout(() => {
        this.linkCopied = false;
      }, 2000);
    });
  }

  sendToUsers(): void {
    if (this.selectedUsers.length === 0) return;

    const post = this.posts.find(p => p.id === this.sharePostId);
    if (post) {
      post.shares += this.selectedUsers.length;
    }

    console.log('Compartiendo con usuarios:', this.selectedUsers);
    alert(`Publicación compartida con ${this.selectedUsers.length} usuario(s)`);
    this.closeShareModal();
  }

  get currentSharePost(): Post | null {
    if (!this.sharePostId) return null;
    return this.posts.find(p => p.id === this.sharePostId) || null;
  }
}