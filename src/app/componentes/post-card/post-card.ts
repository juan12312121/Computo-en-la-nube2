import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ComentariosService } from '../../core/servicios/comentarios/comentarios';
import { LikesService } from '../../core/servicios/likes/likes';
import { AutenticacionService } from '../../core/servicios/autenticacion/autenticacion';
import { FotosService } from '../../core/servicios/fotos/fotos';

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
  editando?: boolean;
  visibilidad?: 'publico' | 'seguidores' | 'privado';
}

interface Theme {
  id: string;
  cardBg?: string;
  textPrimaryClass?: string;
  textSecondaryClass?: string;
  borderColor?: string;
  accentBg?: string;
  hoverBackground?: string;
  textPrimary?: string;
  bodyClass?: string;
  avatarBg?: string;
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

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './post-card.html',
  styleUrls: ['./post-card.css']
})
export class PostCard implements OnInit, OnDestroy {
  @Input() post!: Post;
  @Input() currentTheme!: Theme;
  @Input() usuarioActualId: number | null = null;
  @Input() fotosPerfilCache = new Map<number, string | null>();
  @Input() usuarioActual: any = null;

  @Output() postLikeChanged = new EventEmitter<{ postId: number; liked: boolean; likes: number }>();
  @Output() postHidden = new EventEmitter<number>();
  @Output() postReported = new EventEmitter<number>();
  @Output() postNoInteresa = new EventEmitter<number>();
  @Output() postShared = new EventEmitter<number>();
  @Output() postEdited = new EventEmitter<{ postId: number; content: string }>();
  @Output() postDeleted = new EventEmitter<number>();
  @Output() openPostDetailModal = new EventEmitter<number>();

  showComments = false;
  commentInput = '';
  comments: Comment[] = [];
  loadingComments = false;
  commentsLoaded = false;
  isEditing = false;
  editedContent = '';
  showOptions = false;
  likeLoading = false;

  mostrandoAlertaCensura = false;
  comentarioCensuradoMensaje = '';
  nivelCensura = '';

  private destroy$ = new Subject<void>();
  public readonly s3BaseUrl = 'https://redstudent-uploads.s3.us-east-2.amazonaws.com';

  constructor(
    private comentariosService: ComentariosService,
    private likesService: LikesService,
    private autenticacionService: AutenticacionService,
    private fotosService: FotosService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.post.usuarioId && !this.fotosPerfilCache.has(this.post.usuarioId)) {
      this.cargarFotosPerfilBatch([this.post.usuarioId]);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getVisibilidadIcon(): string {
    switch (this.post.visibilidad) {
      case 'publico': return '🌐';
      case 'seguidores': return '👥';
      case 'privado': return '🔒';
      default: return '🌐';
    }
  }

  getVisibilidadTexto(): string {
    switch (this.post.visibilidad) {
      case 'publico': return 'Público';
      case 'seguidores': return 'Seguidores';
      case 'privado': return 'Solo yo';
      default: return 'Público';
    }
  }

  getVisibilidadClasses(): string {
    switch (this.post.visibilidad) {
      case 'publico': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'seguidores': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'privado': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
      default: return 'bg-green-100 text-green-700';
    }
  }

  navegarAPerfil(usuarioId: number | undefined, event?: Event): void {
    event?.stopPropagation();
    if (!usuarioId) return;
    this.router.navigate(['/perfil', usuarioId]);
  }

  toggleLike(): void {
    if (!this.autenticacionService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    if (this.likeLoading) return;

    const likeAnterior = this.post.liked;
    const likesAnterior = this.post.likes;

    this.post.liked = !this.post.liked;
    this.post.likes += this.post.liked ? 1 : -1;
    this.likeLoading = true;

    this.likesService.toggleLike(this.post.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.likeLoading = false;
          this.postLikeChanged.emit({
            postId: this.post.id,
            liked: this.post.liked,
            likes: this.post.likes
          });
        },
        error: (error) => {
          this.post.liked = likeAnterior;
          this.post.likes = likesAnterior;
          this.likeLoading = false;
          if (error.status === 401) this.router.navigate(['/login']);
        }
      });
  }

  toggleCommentsSection(): void {
    this.showComments = !this.showComments;
    if (this.showComments && !this.commentsLoaded && !this.loadingComments) {
      this.cargarComentarios();
    }
  }

  private cargarComentarios(): void {
    if (this.commentsLoaded || this.loadingComments) return;
    this.loadingComments = true;

    this.comentariosService.obtenerPorPublicacion(this.post.id, 50, 0)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (comentarios) => {
          if (Array.isArray(comentarios) && comentarios.length > 0) {
            const usuariosIds = [...new Set(comentarios.map(c => c.usuario_id))];
            this.cargarFotosPerfilBatch(usuariosIds, () => {
              this.comments = comentarios.map(c => {
                const fotoPerfil = this.obtenerFotoPerfilDesdeCache(c.usuario_id);
                const tieneFoto = !!fotoPerfil?.trim();
                return {
                  id: c.id,
                  author: c.nombre_completo || c.nombre_usuario || 'Usuario',
                  avatar: this.obtenerIniciales(c.nombre_completo || c.nombre_usuario || 'U'),
                  text: c.texto,
                  time: this.formatearTiempo(c.fecha_creacion),
                  avatarColor: this.generarColorAvatar(c.usuario_id),
                  usuario_id: c.usuario_id,
                  foto_perfil_url: tieneFoto ? fotoPerfil : null,
                  usandoIniciales: !tieneFoto
                };
              });
              this.post.totalComments = comentarios.length;
              this.commentsLoaded = true;
              this.loadingComments = false;
              this.cdr.detectChanges();
            });
          } else {
            this.comments = [];
            this.post.totalComments = 0;
            this.commentsLoaded = true;
            this.loadingComments = false;
          }
        },
        error: () => {
          this.comments = [];
          this.commentsLoaded = true;
          this.loadingComments = false;
        }
      });
  }

  addComment(): void {
    const text = this.commentInput.trim();
    if (!text) return;
    if (!this.autenticacionService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    this.comentariosService.crear({ publicacion_id: this.post.id, texto: text })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            let fotoUrl = res.data.foto_perfil_url || res.data.foto_perfil_s3 || null;
            const tieneFoto = !!fotoUrl?.trim();
            if (tieneFoto && res.data.usuario_id) {
              this.fotosPerfilCache.set(res.data.usuario_id, fotoUrl);
            }
            const nuevoComentario: Comment = {
              id: res.data.id,
              author: res.data.nombre_completo || res.data.nombre_usuario || 'Tú',
              avatar: this.obtenerIniciales(res.data.nombre_completo || res.data.nombre_usuario || 'TU'),
              text: res.data.texto,
              time: 'Ahora',
              avatarColor: this.generarColorAvatar(res.data.usuario_id),
              usuario_id: res.data.usuario_id,
              foto_perfil_url: tieneFoto ? fotoUrl : null,
              usandoIniciales: !tieneFoto
            };
            this.comments.unshift(nuevoComentario);
            this.commentInput = '';
            this.post.totalComments = (this.post.totalComments || 0) + 1;
            this.cdr.detectChanges();

            const censura = (res as any).censura;
            if (censura?.fue_censurado) this.mostrarAlertaCensura(censura);
          }
        },
        error: (error) => {
          if (error.status === 401) this.router.navigate(['/login']);
        }
      });
  }

  eliminarComentario(comentarioId: number): void {
    if (!confirm('¿Estás seguro de eliminar este comentario?')) return;
    this.comentariosService.eliminar(comentarioId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.comments = this.comments.filter(c => c.id !== comentarioId);
            this.post.totalComments = Math.max(0, (this.post.totalComments || 0) - 1);
          }
        },
        error: () => alert('Error al eliminar el comentario')
      });
  }

  onCommentKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.addComment();
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
              if (urlFinal?.includes('/uploads/perfil/')) {
                urlFinal = urlFinal.replace('/uploads/perfil/', '/perfiles/');
              }
              this.fotosPerfilCache.set(usuario.id, urlFinal);
            });
          }
          this.cdr.detectChanges();
          if (callback) callback();
        },
        error: () => {
          idsNoEnCache.forEach(id => this.fotosPerfilCache.set(id, null));
          if (callback) callback();
        }
      });
  }

  private obtenerFotoPerfilDesdeCache(usuarioId: number): string | null {
    if (this.fotosPerfilCache.has(usuarioId)) {
      let url = this.fotosPerfilCache.get(usuarioId);
      if (url?.includes('/uploads/perfil/')) {
        url = url.replace('/uploads/perfil/', '/perfiles/');
        this.fotosPerfilCache.set(usuarioId, url);
      }
      return url || null;
    }
    return null;
  }

  private mostrarAlertaCensura(censura: any): void {
    this.comentarioCensuradoMensaje = censura.mensaje_usuario || '💬 Tu comentario fue publicado con moderación automática.';
    this.nivelCensura = censura.nivel || 'bajo';
    this.mostrandoAlertaCensura = true;
    const duracion = censura.nivel === 'alto' ? 7000 : censura.nivel === 'medio' ? 5000 : 3000;
    setTimeout(() => {
      this.mostrandoAlertaCensura = false;
      setTimeout(() => { this.comentarioCensuradoMensaje = ''; this.nivelCensura = ''; }, 500);
    }, duracion);
  }

  cerrarAlertaCensura(): void {
    this.mostrandoAlertaCensura = false;
    setTimeout(() => { this.comentarioCensuradoMensaje = ''; this.nivelCensura = ''; }, 500);
  }

  obtenerColorCensura(nivel: string): string {
    const colores: { [key: string]: string } = {
      'bajo': 'bg-blue-50 border-blue-300 text-blue-800 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-300',
      'medio': 'bg-yellow-50 border-yellow-300 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-700 dark:text-yellow-300',
      'alto': 'bg-red-50 border-red-300 text-red-800 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300'
    };
    return colores[nivel] || 'bg-gray-50 border-gray-300 text-gray-800';
  }

  obtenerIconoCensura(nivel: string): string {
    return nivel === 'alto' ? '🚨' : nivel === 'medio' ? '⚠️' : '💬';
  }

  iniciarEdicion(event?: Event): void {
    event?.stopPropagation();
    if (!this.autenticacionService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    if (this.post.usuarioId !== this.usuarioActualId) {
      alert('Solo puedes editar tus propias publicaciones');
      return;
    }
    this.isEditing = true;
    this.editedContent = this.post.content;
    this.closeOptions();
  }

  cancelarEdicion(): void {
    this.isEditing = false;
    this.editedContent = '';
  }

  guardarEdicion(): void {
    const contenidoLimpio = this.editedContent.trim();
    if (!contenidoLimpio) {
      alert('El contenido no puede estar vacío');
      return;
    }
    if (contenidoLimpio === this.post.content) {
      this.cancelarEdicion();
      return;
    }
    this.postEdited.emit({ postId: this.post.id, content: contenidoLimpio });
    this.post.content = contenidoLimpio;
    this.cancelarEdicion();
  }

  toggleOptions(event?: Event): void {
    event?.stopPropagation();
    this.showOptions = !this.showOptions;
  }

  closeOptions(): void {
    this.showOptions = false;
  }

  openNoInteresaModal(event?: Event): void {
    event?.stopPropagation();
    if (!this.autenticacionService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    if (this.post.usuarioId === this.usuarioActualId) {
      alert('No puedes marcar tus propias publicaciones como "No me interesa"');
      return;
    }
    this.closeOptions();
    this.postNoInteresa.emit(this.post.id);
  }

  ocultarPublicacion(event?: Event): void {
    event?.stopPropagation();
    if (!this.autenticacionService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    const mensaje = this.post.usuarioId === this.usuarioActualId
      ? '¿Ocultar esta publicación? NADIE podrá verla (ni tú en el feed)'
      : '¿Ocultar esta publicación? Solo tú dejarás de verla';
    if (!confirm(mensaje)) return;
    this.closeOptions();
    this.postHidden.emit(this.post.id);
  }

  openReportModal(event?: Event): void {
    event?.stopPropagation();
    if (this.post.usuarioId === this.usuarioActualId) {
      alert('No puedes reportar tus propias publicaciones');
      return;
    }
    if (!this.autenticacionService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    this.closeOptions();
    this.postReported.emit(this.post.id);
  }

  eliminarPublicacion(event?: Event): void {
    event?.stopPropagation();
    if (this.post.usuarioId !== this.usuarioActualId) {
      alert('Solo puedes eliminar tus propias publicaciones');
      return;
    }
    if (!confirm('¿Estás seguro de eliminar esta publicación? Esta acción no se puede deshacer.')) return;
    this.closeOptions();
    this.postDeleted.emit(this.post.id);
  }

  openShareModal(event?: Event): void {
    event?.stopPropagation();
    this.closeOptions();
    this.postShared.emit(this.post.id);
  }

  openPostDetail(): void {
    this.openPostDetailModal.emit(this.post.id);
  }

  obtenerIniciales(nombre: string): string {
    if (!nombre) return 'U';
    const palabras = nombre.trim().split(' ');
    return palabras.length >= 2
      ? (palabras[0][0] + palabras[1][0]).toUpperCase()
      : nombre.substring(0, 2).toUpperCase();
  }

  formatearTiempo(fecha: string): string {
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

  formatearTamanoArchivo(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  obtenerExtensionArchivo(nombreArchivo: string): string {
    return nombreArchivo.split('.').pop()?.toUpperCase() || 'FILE';
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

  generarColorAvatar(id: number): string {
    return AVATAR_COLORS[id % AVATAR_COLORS.length];
  }

  getThemeRingColor(): string {
    const THEME_COLORS: { [key: string]: string } = {
      'default': '#f97316', 'midnight': '#6366f1', 'forest': '#10b981',
      'sunset': '#f59e0b', 'ocean': '#0ea5e9', 'rose': '#ec4899',
      'slate': '#64748b', 'lavender': '#a78bfa', 'neon': '#0ff',
      'toxic': '#84cc16', 'candy': '#ec4899', 'chaos': '#ff0000'
    };
    return THEME_COLORS[this.currentTheme.id] || '#f97316';
  }

  get currentThemeData(): Theme {
    return this.currentTheme;
  }

  trackByCommentId(index: number, comment: Comment): number {
    return comment.id;
  }

  handleImageError(comment: Comment): void {
    comment.usandoIniciales = true;
    comment.foto_perfil_url = null;
    this.cdr.detectChanges();
  }

  onImageLoad(comment: Comment): void {}
}