import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { AutenticacionService } from '../../core/servicios/autenticacion/autenticacion';
import { Comentario, ComentariosService } from '../../core/servicios/comentarios/comentarios';
import { Publicacion } from '../../core/servicios/publicaciones/publicaciones';
import { LikesService } from '../../core/servicios/likes/likes';
import { FotosService } from '../../core/servicios/fotos/fotos';
import { Theme, ThemeService } from '../../core/servicios/temas';
import { DetallePost } from '../detalle-post/detalle-post';

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
  profileImageUrl?: string | null;
  showComments?: boolean;
  totalComments?: number;
  loadingComments?: boolean;
  hasMoreComments?: boolean;
  usuario_id?: number;
  visibilidad?: 'publico' | 'seguidores' | 'privado';
  likeLoading?: boolean; // ✅ NUEVO: Para controlar estado de like
}

interface Comment {
  id: number;
  author: string;
  avatar: string;
  text: string;
  time: string;
  avatarColor: string;
  profileImageUrl?: string | null;
  usuarioId?: number;
  canDelete?: boolean;
  foto_perfil_url?: string | null;
  usandoIniciales?: boolean;
}

@Component({
  selector: 'app-publicaciones-perfil',
  standalone: true,
  imports: [CommonModule, DetallePost, FormsModule],
  templateUrl: './publicaciones-perfil.html',
  styleUrl: './publicaciones-perfil.css'
})
export class PublicacionesPerfil implements OnChanges, OnInit, OnDestroy {
  @Input() publicaciones: Publicacion[] = [];
  @Input() cargando = false;
  @Input() usuarioNombre = '';
  @Input() usuarioIniciales = '';
  @Input() apiBaseUrl = '';
  @Input() usuarioFotoPerfil: string | null = null;
  
  @Output() likeToggled = new EventEmitter<number>();
  @Output() postShared = new EventEmitter<{postId: number, platform: string}>();
  @Output() reportarPublicacion = new EventEmitter<number>();

  posts: Post[] = [];
  commentInputs: { [key: number]: string } = {};

  selectedPost: Post | null = null;
  showPostDetail = false;
  showShareModal = false;
  sharePostId: number | null = null;
  activeMenuId: number | null = null;

  currentTheme: Theme;
  private themeSubscription?: Subscription;
  private usuarioActualId: number | null = null;
  private comentariosSubscriptions: Map<number, Subscription> = new Map();
  private destroy$ = new Subject<void>(); // ✅ NUEVO

  fotosPerfilCache = new Map<number, string | null>();

  constructor(
    private themeService: ThemeService,
    private comentariosService: ComentariosService,
    private autenticacionService: AutenticacionService,
    private likesService: LikesService, // ✅ NUEVO
    private fotosService: FotosService,
    private router: Router, // ✅ NUEVO
    private cdr: ChangeDetectorRef
  ) {
    this.currentTheme = this.themeService.getCurrentTheme();
    const currentUser = this.autenticacionService.currentUserValue;
    this.usuarioActualId = currentUser ? currentUser.id : null;
  }

  ngOnInit(): void {
    this.themeSubscription = this.themeService.currentTheme$.subscribe(theme => {
      this.currentTheme = theme;
    });
  }

  ngOnDestroy(): void {
    this.themeSubscription?.unsubscribe();
    this.comentariosSubscriptions.forEach(sub => sub.unsubscribe());
    this.comentariosSubscriptions.clear();
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['publicaciones']) {
      const nuevasPublicaciones = changes['publicaciones'].currentValue as Publicacion[];

      if (nuevasPublicaciones && nuevasPublicaciones.length > 0) {
        this.actualizarPostsDesdeAPI();
      }
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    this.activeMenuId = null;
  }

  toggleMenu(postId: number, event: Event): void {
    event.stopPropagation();
    this.activeMenuId = this.activeMenuId === postId ? null : postId;
  }

  private actualizarPostsDesdeAPI(): void {
    this.posts = this.publicaciones.map(pub => {
      const urlImagen = this.obtenerUrlImagen(pub);
      
      const post: Post = {
        id: pub.id,
        author: pub.nombre_completo || pub.nombre_usuario || 'Usuario',
        avatar: this.obtenerIniciales(pub.nombre_completo || pub.nombre_usuario || 'Usuario'),
        time: this.calcularTiempoTranscurrido(pub.fecha_creacion),
        content: pub.contenido,
        image: urlImagen,
        category: pub.categoria || 'General',
        categoryColor: pub.color_categoria || 'bg-gray-500',
        likes: pub.total_likes || 0, // ✅ USAR total_likes del backend
        liked: false, // ✅ Se verificará después
        shares: 0,
        avatarColor: this.generarColorAvatar(pub.usuario_id),
        comments: [],
        profileImageUrl: this.obtenerUrlFotoPerfil(pub),
        showComments: false,
        totalComments: pub.total_comentarios || 0, // ✅ USAR total_comentarios del backend
        loadingComments: false,
        hasMoreComments: false,
        usuario_id: pub.usuario_id,
        visibilidad: pub.visibilidad || 'publico',
        likeLoading: false
      };

      // ✅ Verificar si el usuario actual dio like a esta publicación
      if (this.autenticacionService.isAuthenticated()) {
        this.verificarLikeUsuario(post);
      }

      return post;
    });
  }

  // ✅ NUEVO: Verificar si el usuario dio like
  private verificarLikeUsuario(post: Post): void {
    this.likesService.verificarLike(post.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            post.liked = response.data.usuario_dio_like || false;
            post.likes = response.data.total_likes || post.likes;
            this.cdr.detectChanges();
          }
        },
        error: (error) => {
          console.error('Error al verificar like:', error);
        }
      });
  }

  // ✅ MEJORADO: Toggle like con lógica de post-card
  toggleLike(postId: number): void {
    if (!this.autenticacionService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    const post = this.posts.find(p => p.id === postId);
    if (!post || post.likeLoading) return;

    const likeAnterior = post.liked;
    const likesAnterior = post.likes;
    const nuevoEstado = !post.liked;

    console.log('🔄 Toggle Like en Perfil:', {
      publicacionId: postId,
      estadoAnterior: likeAnterior,
      nuevoEstado: nuevoEstado,
      likesAnterior: likesAnterior
    });

    // ✅ Actualización optimista INMEDIATA
    post.liked = nuevoEstado;
    post.likes += nuevoEstado ? 1 : -1;
    post.likeLoading = true;
    this.cdr.detectChanges();

    this.likesService.toggleLike(postId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('✅ Respuesta del servidor (Perfil):', response);
          
          if (response.success && response.data) {
            if (response.data.usuario_dio_like !== undefined) {
              post.liked = response.data.usuario_dio_like;
            }
            if (response.data.total_likes !== undefined) {
              post.likes = response.data.total_likes;
            }
            
            console.log('📊 Estado sincronizado (Perfil):', {
              liked: post.liked,
              likes: post.likes
            });
          }
          
          post.likeLoading = false;
          this.likeToggled.emit(postId);
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('❌ Error en toggle like (Perfil):', error);
          // Revertir en caso de error
          post.liked = likeAnterior;
          post.likes = likesAnterior;
          post.likeLoading = false;
          if (error.status === 401) this.router.navigate(['/login']);
          this.cdr.detectChanges();
        }
      });
  }

  toggleComments(postId: number): void {
    const post = this.posts.find(p => p.id === postId);
    if (!post) return;

    post.showComments = !post.showComments;

    if (post.showComments && post.comments.length === 0 && !post.loadingComments) {
      this.cargarComentarios(postId);
    }
  }

  cargarComentarios(postId: number): void {
    const post = this.posts.find(p => p.id === postId);
    if (!post) return;

    post.loadingComments = true;

    const subscription = this.comentariosSubscriptions.get(postId);
    if (subscription) {
      subscription.unsubscribe();
    }

    const newSubscription = this.comentariosService.obtenerPorPublicacion(postId, 20, 0)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (comentarios) => {
          if (Array.isArray(comentarios) && comentarios.length > 0) {
            const usuariosIds = [...new Set(comentarios.map(c => c.usuario_id))];

            this.cargarFotosPerfilBatch(usuariosIds, () => {
              post.comments = comentarios.map(c => this.convertirComentarioAComment(c));
              post.totalComments = comentarios.length;
              post.hasMoreComments = false;
              post.loadingComments = false;
              this.cdr.detectChanges();
            });
          } else {
            post.comments = [];
            post.totalComments = 0;
            post.hasMoreComments = false;
            post.loadingComments = false;
          }
        },
        error: (error) => {
          console.error('Error al cargar comentarios:', error);
          post.comments = [];
          post.totalComments = 0;
          post.loadingComments = false;
        }
      });

    this.comentariosSubscriptions.set(postId, newSubscription);
  }

  addComment(postId: number, commentText: string): void {
    const text = commentText.trim();
    if (!text) return;

    if (!this.autenticacionService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    const post = this.posts.find(p => p.id === postId);
    if (!post) return;

    this.comentariosService.crear({
      publicacion_id: postId,
      texto: text
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response) => {
        if (response.success && response.data) {
          let fotoPerfilUrl: string | null = null;

          if (response.data.foto_perfil_url) {
            fotoPerfilUrl = response.data.foto_perfil_url;
          } else if (response.data.foto_perfil_s3) {
            fotoPerfilUrl = response.data.foto_perfil_s3;
          }

          if (fotoPerfilUrl && fotoPerfilUrl.includes('/uploads/perfil/')) {
            fotoPerfilUrl = fotoPerfilUrl.replace('/uploads/perfil/', '/perfiles/');
          }

          const tieneFoto = fotoPerfilUrl !== null && fotoPerfilUrl !== undefined && fotoPerfilUrl.trim() !== '';

          if (tieneFoto && response.data.usuario_id) {
            this.fotosPerfilCache.set(response.data.usuario_id, fotoPerfilUrl);
          }

          const nuevoComentario: Comment = {
            id: response.data.id,
            author: response.data.nombre_completo || response.data.nombre_usuario,
            avatar: this.obtenerIniciales(response.data.nombre_completo || response.data.nombre_usuario),
            text: response.data.texto,
            time: 'Ahora',
            avatarColor: this.generarColorAvatar(response.data.usuario_id),
            profileImageUrl: tieneFoto ? fotoPerfilUrl : null,
            usuarioId: response.data.usuario_id,
            canDelete: true,
            foto_perfil_url: tieneFoto ? fotoPerfilUrl : null,
            usandoIniciales: !tieneFoto
          };

          post.comments.unshift(nuevoComentario);
          post.totalComments = (post.totalComments || 0) + 1;
          this.commentInputs[postId] = '';
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        console.error('Error al crear comentario:', error);
        if (error.status === 401) this.router.navigate(['/login']);
        alert('No se pudo agregar el comentario.');
      }
    });
  }

  eliminarComentario(postId: number, comentarioId: number): void {
    const post = this.posts.find(p => p.id === postId);
    if (!post) return;

    const comentario = post.comments.find(c => c.id === comentarioId);
    if (!comentario || !comentario.canDelete) {
      alert('No tienes permiso para eliminar este comentario');
      return;
    }

    if (!confirm('¿Estás seguro de eliminar este comentario?')) return;

    this.comentariosService.eliminar(comentarioId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            post.comments = post.comments.filter(c => c.id !== comentarioId);
            post.totalComments = Math.max(0, (post.totalComments || 0) - 1);
            this.cdr.detectChanges();
          }
        },
        error: () => {
          alert('Error al eliminar el comentario.');
        }
      });
  }

  onCommentKeyPress(event: KeyboardEvent, postId: number, commentText: string): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.addComment(postId, commentText);
    }
  }

  onLikeToggled(postId: number): void {
    const post = this.posts.find(p => p.id === postId);
    
    if (post) {
      this.cdr.detectChanges();
      
      console.log(`✅ Like sincronizado en perfil para post ${postId}:`, {
        liked: post.liked,
        likes: post.likes
      });
    }
  }

  openPostDetail(postId: number): void {
    const post = this.posts.find(p => p.id === postId);
    if (post) {
      this.selectedPost = post;
      this.showPostDetail = true;
      
      if (post.comments.length === 0 && !post.loadingComments) {
        this.cargarComentarios(postId);
      }
    }
  }

  closePostDetail(): void {
    this.showPostDetail = false;
    this.selectedPost = null;
  }

  openShareModal(postId: number): void {
    this.sharePostId = postId;
    const post = this.posts.find(p => p.id === postId);
    if (post) {
      this.selectedPost = post;
      this.showShareModal = true;
      document.body.style.overflow = 'hidden';
    }
  }

  closeShareModal(): void {
    this.showShareModal = false;
    this.sharePostId = null;
    document.body.style.overflow = 'auto';
  }

  onShareToSocial(data: {postId: number, platform: string}): void {
    const post = this.posts.find(p => p.id === data.postId);
    if (post) {
      post.shares += 1;
    }
    this.postShared.emit(data);
    this.closeShareModal();
  }

  onShareToUsers(data: {postId: number, userIds: number[]}): void {
    const post = this.posts.find(p => p.id === data.postId);
    if (post) {
      post.shares += data.userIds.length;
    }
    this.closeShareModal();
  }

  onShareModalOpened(postId: number): void {
    this.openShareModal(postId);
  }

  private cargarFotosPerfilBatch(usuariosIds: number[], callback?: () => void): void {
    const idsNoEnCache = usuariosIds.filter(id => !this.fotosPerfilCache.has(id));

    if (idsNoEnCache.length === 0) {
      if (callback) callback();
      return;
    }

    this.fotosService.obtenerFotosBatch(idsNoEnCache)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            response.data.forEach(usuario => {
              let urlFinal = usuario.foto_perfil_url || null;
              
              if (urlFinal && urlFinal.includes('/uploads/perfil/')) {
                urlFinal = urlFinal.replace('/uploads/perfil/', '/perfiles/');
              }

              this.fotosPerfilCache.set(usuario.id, urlFinal);
            });
          }

          if (callback) callback();
        },
        error: (error) => {
          idsNoEnCache.forEach(id => {
            this.fotosPerfilCache.set(id, null);
          });

          if (callback) callback();
        }
      });
  }

  private obtenerFotoPerfilDesdeCache(usuarioId: number): string | null {
    if (this.fotosPerfilCache.has(usuarioId)) {
      let url = this.fotosPerfilCache.get(usuarioId);
      
      if (url && url.includes('/uploads/perfil/')) {
        url = url.replace('/uploads/perfil/', '/perfiles/');
        this.fotosPerfilCache.set(usuarioId, url);
      }
      
      return url || null;
    }

    return null;
  }

  private convertirComentarioAComment(comentario: Comentario): Comment {
    const fotoPerfil = this.obtenerFotoPerfilDesdeCache(comentario.usuario_id);
    const tieneFoto = fotoPerfil !== null && fotoPerfil !== undefined && fotoPerfil.trim() !== '';

    return {
      id: comentario.id,
      author: comentario.nombre_completo || comentario.nombre_usuario,
      avatar: this.obtenerIniciales(comentario.nombre_completo || comentario.nombre_usuario),
      text: comentario.texto,
      time: this.calcularTiempoTranscurrido(comentario.fecha_creacion),
      avatarColor: this.generarColorAvatar(comentario.usuario_id),
      profileImageUrl: tieneFoto ? fotoPerfil : null,
      usuarioId: comentario.usuario_id,
      canDelete: comentario.usuario_id === this.usuarioActualId,
      foto_perfil_url: tieneFoto ? fotoPerfil : null,
      usandoIniciales: !tieneFoto
    };
  }

  private obtenerUrlImagen(pub: Publicacion): string | null {
    if (pub.imagen_s3) {
      if (pub.imagen_s3.includes('/undefined')) return null;
      if (pub.imagen_s3.includes('s3') || pub.imagen_s3.startsWith('http')) return pub.imagen_s3;
      if (this.apiBaseUrl) return `${this.apiBaseUrl}${pub.imagen_s3}`;
      return pub.imagen_s3;
    }

    if (pub.imagen_url) {
      if (pub.imagen_url.includes('/undefined')) return null;
      if (pub.imagen_url.includes('s3') || pub.imagen_url.startsWith('http')) return pub.imagen_url;
      if (this.apiBaseUrl) return `${this.apiBaseUrl}${pub.imagen_url}`;
      return pub.imagen_url;
    }

    return null;
  }

  private obtenerUrlFotoPerfil(pub: Publicacion): string | null {
    const fotoPerfil = (pub as any).foto_perfil_url;
    
    if (fotoPerfil) {
      return fotoPerfil.startsWith('http') ? fotoPerfil : `${this.apiBaseUrl}${fotoPerfil}`;
    }
    
    return this.usuarioFotoPerfil;
  }

  private obtenerIniciales(nombre: string): string {
    if (!nombre) return 'U';
    const palabras = nombre.trim().split(' ');
    return palabras.length >= 2
      ? (palabras[0][0] + palabras[1][0]).toUpperCase()
      : nombre.substring(0, 2).toUpperCase();
  }

  private calcularTiempoTranscurrido(fecha: string): string {
    const ahora = new Date();
    const fechaPublicacion = new Date(fecha);
    const diferencia = ahora.getTime() - fechaPublicacion.getTime();
    
    const minutos = Math.floor(diferencia / 60000);
    const horas = Math.floor(diferencia / 3600000);
    const dias = Math.floor(diferencia / 86400000);
    
    if (minutos < 1) return 'Ahora';
    if (minutos < 60) return `Hace ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`;
    if (horas < 24) return `Hace ${horas} ${horas === 1 ? 'hora' : 'horas'}`;
    if (dias < 7) return `Hace ${dias} ${dias === 1 ? 'día' : 'días'}`;
    if (dias < 30) return `Hace ${Math.floor(dias / 7)} ${Math.floor(dias / 7) === 1 ? 'semana' : 'semanas'}`;
    return `Hace ${Math.floor(dias / 30)} ${Math.floor(dias / 30) === 1 ? 'mes' : 'meses'}`;
  }

  private generarColorAvatar(usuarioId: number): string {
    const colores = [
      'from-blue-400 to-blue-600',
      'from-purple-400 to-purple-600',
      'from-pink-400 to-pink-600',
      'from-red-400 to-red-600',
      'from-orange-400 to-orange-600',
      'from-yellow-400 to-yellow-600',
      'from-green-400 to-green-600',
      'from-teal-400 to-teal-600',
      'from-indigo-400 to-indigo-600'
    ];
    return colores[usuarioId % colores.length];
  }

  handleImageError(comment: Comment): void {
    comment.usandoIniciales = true;
    comment.foto_perfil_url = null;
    comment.profileImageUrl = null;
    this.cdr.detectChanges();
  }

  onImageLoad(comment: Comment): void {
    // Imagen cargada correctamente
  }

  trackByCommentId(index: number, comment: Comment): number {
    return comment.id;
  }

  getVisibilidadIcon(post: Post): string {
    switch (post.visibilidad) {
      case 'publico': return '🌐';
      case 'seguidores': return '👥';
      case 'privado': return '🔒';
      default: return '🌐';
    }
  }

  getVisibilidadTexto(post: Post): string {
    switch (post.visibilidad) {
      case 'publico': return 'Público';
      case 'seguidores': return 'Seguidores';
      case 'privado': return 'Solo yo';
      default: return 'Público';
    }
  }

  getVisibilidadClasses(post: Post): string {
    switch (post.visibilidad) {
      case 'publico': return 'bg-green-100 text-green-700';
      case 'seguidores': return 'bg-blue-100 text-blue-700';
      case 'privado': return 'bg-gray-100 text-gray-700';
      default: return 'bg-green-100 text-green-700';
    }
  }

  cargarMasComentarios(postId: number): void {
    const post = this.posts.find(p => p.id === postId);
    if (!post || post.loadingComments || !post.hasMoreComments) return;

    post.loadingComments = true;

    this.comentariosService.obtenerPorPublicacion(postId, 20, post.comments.length)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (comentarios) => {
          if (Array.isArray(comentarios) && comentarios.length > 0) {
            const usuariosIds = [...new Set(comentarios.map(c => c.usuario_id))];
            
            this.cargarFotosPerfilBatch(usuariosIds, () => {
              const nuevosComentarios = comentarios.map(c => this.convertirComentarioAComment(c));
              post.comments = [...post.comments, ...nuevosComentarios];
              post.hasMoreComments = comentarios.length === 20;
              post.loadingComments = false;
              this.cdr.detectChanges();
            });
          } else {
            post.hasMoreComments = false;
            post.loadingComments = false;
          }
        },
        error: () => {
          post.hasMoreComments = false;
          post.loadingComments = false;
        }
      });
  }
}