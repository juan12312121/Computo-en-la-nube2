import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AutenticacionService } from '../../core/servicios/autenticacion/autenticacion';
import { Comentario, ComentariosService } from '../../core/servicios/comentarios/comentarios';
import { Publicacion } from '../../core/servicios/publicaciones/publicaciones';
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
}

interface Photo {
  id: number | string;
  url: string;
  caption: string;
  postId: number;
  tipo: 'perfil' | 'portada' | 'publicacion';
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

  posts: Post[] = [];
  photos: Photo[] = [];
  commentInputs: { [key: number]: string } = {};

  selectedPost: Post | null = null;
  showPostDetail = false;

  showShareModal = false;
  sharePostId: number | null = null;

  currentTheme: Theme;
  private themeSubscription?: Subscription;
  private usuarioActualId: number | null = null;
  private comentariosSubscriptions: Map<number, Subscription> = new Map();

  constructor(
    private themeService: ThemeService,
    private comentariosService: ComentariosService,
    private autenticacionService: AutenticacionService
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
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('🔄 ngOnChanges llamado');
    
    if (changes['publicaciones']) {
      const nuevasPublicaciones = changes['publicaciones'].currentValue as Publicacion[];
      console.log('📋 Publicaciones:', nuevasPublicaciones?.length || 0);

      if (nuevasPublicaciones && nuevasPublicaciones.length > 0) {
        console.log('✅ Actualizando posts...');
        this.actualizarPostsDesdeAPI();
      }
    }
  }

  private actualizarPostsDesdeAPI(): void {
    console.log('🔄 Procesando publicaciones...');
    console.log('📍 apiBaseUrl:', this.apiBaseUrl);
    
    this.posts = this.publicaciones.map(pub => {
      const urlImagen = this.obtenerUrlImagen(pub);
      
      return {
        id: pub.id,
        author: pub.nombre_completo || pub.nombre_usuario || 'Usuario',
        avatar: this.obtenerIniciales(pub.nombre_completo || pub.nombre_usuario || 'Usuario'),
        time: this.calcularTiempoTranscurrido(pub.fecha_creacion),
        content: pub.contenido,
        image: urlImagen,
        category: pub.categoria || 'General',
        categoryColor: pub.color_categoria || 'bg-gray-500',
        likes: 0,
        liked: false,
        shares: 0,
        avatarColor: this.generarColorAvatar(pub.usuario_id),
        comments: [],
        profileImageUrl: this.obtenerUrlFotoPerfil(pub),
        showComments: false,
        totalComments: 0,
        loadingComments: false,
        hasMoreComments: false
      };
    });

    const postsConImagen = this.posts.filter(p => p.image).length;
    console.log('✅ Posts procesados:', this.posts.length);
    console.log('🖼️ Posts con imágenes:', postsConImagen);
  }

  private obtenerUrlImagen(pub: Publicacion): string | null {
    // Priorizar imagen_s3
    if (pub.imagen_s3) {
      if (pub.imagen_s3.includes('/undefined')) {
        return null;
      }
      
      // Si ya contiene S3 o http, devolverla tal cual
      if (pub.imagen_s3.includes('s3') || pub.imagen_s3.startsWith('http')) {
        return pub.imagen_s3;
      }
      
      // Completar con apiBaseUrl si es necesario
      if (this.apiBaseUrl) {
        return `${this.apiBaseUrl}${pub.imagen_s3}`;
      }
      
      return pub.imagen_s3;
    }

    // Fallback a imagen_url
    if (pub.imagen_url) {
      if (pub.imagen_url.includes('/undefined')) {
        return null;
      }
      
      if (pub.imagen_url.includes('s3') || pub.imagen_url.startsWith('http')) {
        return pub.imagen_url;
      }
      
      if (this.apiBaseUrl) {
        return `${this.apiBaseUrl}${pub.imagen_url}`;
      }
      
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
    const palabras = nombre.trim().split(' ');
    if (palabras.length >= 2) {
      return (palabras[0][0] + palabras[1][0]).toUpperCase();
    }
    return nombre.substring(0, 2).toUpperCase();
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

  cargarComentarios(postId: number): void {
    const post = this.posts.find(p => p.id === postId);
    if (!post) return;

    post.loadingComments = true;

    const subscription = this.comentariosSubscriptions.get(postId);
    if (subscription) {
      subscription.unsubscribe();
    }

    const newSubscription = this.comentariosService.obtenerPorPublicacion(postId, 20, 0).subscribe({
      next: (comentarios) => {
        if (Array.isArray(comentarios)) {
          post.comments = comentarios.map(c => this.convertirComentarioAComment(c));
          post.totalComments = comentarios.length;
          post.hasMoreComments = false;
        }
        post.loadingComments = false;
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

  cargarMasComentarios(postId: number): void {
    const post = this.posts.find(p => p.id === postId);
    if (!post || post.loadingComments || !post.hasMoreComments) return;

    post.loadingComments = true;

    this.comentariosService.obtenerPorPublicacion(postId, 20, post.comments.length).subscribe({
      next: (comentarios) => {
        if (Array.isArray(comentarios) && comentarios.length > 0) {
          const nuevosComentarios = comentarios.map(c => this.convertirComentarioAComment(c));
          post.comments = [...post.comments, ...nuevosComentarios];
          post.hasMoreComments = comentarios.length === 20;
        } else {
          post.hasMoreComments = false;
        }
        post.loadingComments = false;
      },
      error: () => {
        post.hasMoreComments = false;
        post.loadingComments = false;
      }
    });
  }

  private convertirComentarioAComment(comentario: Comentario): Comment {
    let fotoPerfilUrl: string | null = null;
    
    if (comentario.foto_perfil_s3) {
      fotoPerfilUrl = comentario.foto_perfil_s3.startsWith('http')
        ? comentario.foto_perfil_s3
        : `${this.apiBaseUrl}${comentario.foto_perfil_s3}`;
    } else if (comentario.foto_perfil_url) {
      fotoPerfilUrl = comentario.foto_perfil_url.startsWith('http')
        ? comentario.foto_perfil_url
        : `${this.apiBaseUrl}${comentario.foto_perfil_url}`;
    }

    return {
      id: comentario.id,
      author: comentario.nombre_completo || comentario.nombre_usuario,
      avatar: this.obtenerIniciales(comentario.nombre_completo || comentario.nombre_usuario),
      text: comentario.texto,
      time: this.calcularTiempoTranscurrido(comentario.fecha_creacion),
      avatarColor: this.generarColorAvatar(comentario.usuario_id),
      profileImageUrl: fotoPerfilUrl,
      usuarioId: comentario.usuario_id,
      canDelete: comentario.usuario_id === this.usuarioActualId
    };
  }

  addComment(postId: number, commentText: string): void {
    const text = commentText.trim();
    if (!text) return;

    const post = this.posts.find(p => p.id === postId);
    if (!post) return;

    this.comentariosService.crear({
      publicacion_id: postId,
      texto: text
    }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const nuevoComentario = this.convertirComentarioAComment(response.data);
          post.comments.unshift(nuevoComentario);
          post.totalComments = (post.totalComments || 0) + 1;
          this.commentInputs[postId] = '';
        }
      },
      error: () => {
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

    if (!confirm('¿Estás seguro?')) return;

    this.comentariosService.eliminar(comentarioId).subscribe({
      next: (response) => {
        if (response.success) {
          post.comments = post.comments.filter(c => c.id !== comentarioId);
          post.totalComments = Math.max(0, (post.totalComments || 0) - 1);
        }
      },
      error: () => {
        alert('Error al eliminar el comentario.');
      }
    });
  }

  toggleLike(postId: number): void {
    const post = this.posts.find(p => p.id === postId);
    if (post) {
      post.liked = !post.liked;
      post.likes += post.liked ? 1 : -1;
    }
    this.likeToggled.emit(postId);
  }

  toggleComments(postId: number): void {
    const post = this.posts.find(p => p.id === postId);
    if (!post) return;

    post.showComments = !post.showComments;

    if (post.showComments && post.comments.length === 0 && !post.loadingComments) {
      this.cargarComentarios(postId);
    }
  }

  onCommentKeyPress(event: KeyboardEvent, postId: number, commentText: string): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.addComment(postId, commentText);
    }
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

  onLikeToggled(postId: number): void {
    this.toggleLike(postId);
  }

  onShareModalOpened(postId: number): void {
    this.openShareModal(postId);
  }

  openPhotoDetail(photoId: number): void {
    const photo = this.photos.find(p => p.id === photoId);
    if (photo) {
      const post = this.posts.find(p => p.id === photo.postId);
      if (post) {
        this.selectedPost = post;
        this.showPostDetail = true;
      }
    }
  }

  trackByCommentId(index: number, comment: Comment): number {
    return comment.id;
  }
}