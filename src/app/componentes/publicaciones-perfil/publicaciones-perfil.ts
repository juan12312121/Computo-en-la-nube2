import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
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
}

interface Comment {
  id: number;
  author: string;
  avatar: string;
  text: string;
  time: string;
  avatarColor: string;
}

interface Photo {
  id: number;
  url: string;
  caption: string;
  postId: number;
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
  @Output() commentAdded = new EventEmitter<{postId: number, comment: string}>();
  @Output() postShared = new EventEmitter<{postId: number, platform: string}>();

  // Datos convertidos
  posts: Post[] = [];
  photos: Photo[] = [];
  commentInputs: { [key: number]: string } = {};

  // Detalle de post
  selectedPost: Post | null = null;
  showPostDetail = false;

  // Compartir
  showShareModal = false;
  sharePostId: number | null = null;

  // Tema
  currentTheme: Theme;
  private themeSubscription?: Subscription;

  constructor(private themeService: ThemeService) {
    this.currentTheme = this.themeService.getCurrentTheme();
  }

  ngOnInit(): void {
    this.themeSubscription = this.themeService.currentTheme$.subscribe(theme => {
      this.currentTheme = theme;
    });
  }

  ngOnDestroy(): void {
    this.themeSubscription?.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['publicaciones'] && this.publicaciones) {
      this.actualizarPostsDesdeAPI();
    }
  }

  // ==================== CONVERSIÓN DE DATOS ====================
  
  private actualizarPostsDesdeAPI(): void {
    this.posts = this.publicaciones.map(pub => this.convertirPublicacionAPost(pub));
    
    // Actualizar también las fotos desde las publicaciones con imagen
    this.photos = this.publicaciones
      .filter(pub => pub.imagen_url || pub.imagen_s3)
      .map((pub) => ({
        id: pub.id,
        url: this.obtenerUrlImagen(pub)!,
        caption: pub.contenido.substring(0, 50) + (pub.contenido.length > 50 ? '...' : ''),
        postId: pub.id
      }));
  }

  private convertirPublicacionAPost(pub: Publicacion): Post {
    return {
      id: pub.id,
      author: pub.nombre_completo || pub.nombre_usuario || 'Usuario',
      avatar: this.obtenerIniciales(pub.nombre_completo || pub.nombre_usuario || 'Usuario'),
      time: this.calcularTiempoTranscurrido(pub.fecha_creacion),
      content: pub.contenido,
      image: this.obtenerUrlImagen(pub),
      category: pub.categoria || 'General',
      categoryColor: pub.color_categoria || 'bg-gray-500',
      likes: 0,
      liked: false,
      shares: 0,
      avatarColor: this.generarColorAvatar(pub.usuario_id),
      comments: [],
      profileImageUrl: this.obtenerUrlFotoPerfil(pub),
      showComments: false
    };
  }

  private obtenerUrlImagen(pub: Publicacion): string | null {
    if (pub.imagen_s3) {
      return pub.imagen_s3.startsWith('http') ? pub.imagen_s3 : `${this.apiBaseUrl}${pub.imagen_s3}`;
    }
    if (pub.imagen_url) {
      return pub.imagen_url.startsWith('http') ? pub.imagen_url : `${this.apiBaseUrl}${pub.imagen_url}`;
    }
    return null;
  }

  private obtenerUrlFotoPerfil(pub: Publicacion): string | null {
    const fotoPerfil = (pub as any).foto_perfil_url;
    
    if (fotoPerfil) {
      if (fotoPerfil.startsWith('http')) {
        return fotoPerfil;
      }
      return `${this.apiBaseUrl}${fotoPerfil}`;
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

  // ==================== MANEJO DE POSTS ====================
  
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
    if (post) {
      post.showComments = !post.showComments;
    }
  }

  addComment(postId: number, commentText: string): void {
    const text = commentText.trim();
    if (!text) return;

    const post = this.posts.find(p => p.id === postId);
    if (post) {
      const newComment: Comment = {
        id: post.comments.length + 1,
        author: this.usuarioNombre,
        avatar: this.usuarioIniciales,
        text: text,
        time: 'Ahora',
        avatarColor: 'from-teal-400 to-teal-600'
      };
      post.comments.push(newComment);
      this.commentAdded.emit({ postId, comment: text });
      
      // Limpiar el input después de agregar el comentario
      this.commentInputs[postId] = '';
    }
  }

  onCommentKeyPress(event: KeyboardEvent, postId: number, commentText: string): void {
    if (event.key === 'Enter') {
      this.addComment(postId, commentText);
    }
  }

  // ==================== COMPARTIR ====================
  
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
    console.log('Compartiendo post con usuarios:', data);
    this.closeShareModal();
  }

  // ==================== DETALLE DE POST ====================
  
  openPostDetail(postId: number): void {
    const post = this.posts.find(p => p.id === postId);
    if (post) {
      this.selectedPost = post;
      this.showPostDetail = true;
    }
  }

  closePostDetail(): void {
    this.showPostDetail = false;
    this.selectedPost = null;
  }

  onLikeToggled(postId: number): void {
    this.toggleLike(postId);
  }

  onCommentAdded(data: {postId: number, comment: string}): void {
    const post = this.posts.find(p => p.id === data.postId);
    if (post) {
      const newComment: Comment = {
        id: post.comments.length + 1,
        author: this.usuarioNombre,
        avatar: this.usuarioIniciales,
        text: data.comment,
        time: 'Ahora',
        avatarColor: 'from-teal-400 to-teal-600'
      };
      post.comments.push(newComment);
    }
    this.commentAdded.emit(data);
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
}