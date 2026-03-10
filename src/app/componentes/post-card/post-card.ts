import { CommonModule } from '@angular/common';
import { Component, input, output, signal, inject, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ComentariosService } from '../../core/servicios/comentarios/comentarios';
import { LikesService } from '../../core/servicios/likes/likes';
import { AutenticacionService } from '../../core/servicios/autenticacion/autenticacion';
import { FotosService } from '../../core/servicios/fotos/fotos';
import * as Utils from '../../core/utilidades/formateadores';
import { environment } from '../../../environments/environment';

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
  liked?: boolean;
  shares: number;
  avatarColor: string;
  comments?: Comment[];
  showComments?: boolean;
  usuario_id?: number;
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
  styleUrls: ['./post-card.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostCard implements OnInit, OnDestroy {
  post = input.required<Post>();
  currentTheme = input.required<Theme>();
  usuarioActualId = input<number | null>(null);
  usuarioActual = input<any>(null);

  postLikeChanged = output<{ postId: number; liked: boolean; likes: number }>();
  postHidden = output<number>();
  postReported = output<number>();
  postNoInteresa = output<number>();
  postShared = output<number>();
  postEdited = output<{ postId: number; content: string }>();
  postDeleted = output<number>();
  openPostDetailModal = output<number>();

  showComments = signal(false);
  commentInput = signal('');
  comments = signal<Comment[]>([]);
  loadingComments = signal(false);
  commentsLoaded = signal(false);
  isEditing = signal(false);
  editedContent = signal('');
  showOptions = signal(false);
  likeLoading = signal(false);

  mostrandoAlertaCensura = signal(false);
  comentarioCensuradoMensaje = signal('');
  nivelCensura = signal('');

  private destroy$ = new Subject<void>();
  private readonly s3BaseUrl = 'https://redstudent-uploads.s3.us-east-2.amazonaws.com';
  private readonly apiBaseUrl = environment.socketUrl;

  private comentariosService = inject(ComentariosService);
  private likesService = inject(LikesService);
  private autenticacionService = inject(AutenticacionService);
  private fotosService = inject(FotosService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    // El estado del like ya viene del padre (Principal/Perfil)
    // El servicio SocketService se encarga de las actualizaciones en tiempo real
  }



  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getVisibilidadIcon(): string {
    const v = this.post().visibilidad;
    if (v === 'seguidores') return '👥';
    if (v === 'privado') return '🔒';
    return '🌐';
  }

  getVisibilidadTexto(): string {
    const v = this.post().visibilidad;
    if (v === 'seguidores') return 'Seguidores';
    if (v === 'privado') return 'Solo yo';
    return 'Público';
  }

  getVisibilidadClasses(): string {
    const v = this.post().visibilidad;
    if (v === 'seguidores') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    if (v === 'privado') return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  }

  navegarAPerfil(id: number | undefined, e?: Event): void {
    e?.stopPropagation();
    if (id) this.router.navigate(['/perfil', id]);
  }

  toggleLike(): void {
    if (!this.autenticacionService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    if (this.likeLoading()) return;

    const post = this.post();
    const prevLiked = post.liked ?? false;
    const prevLikes = post.likes ?? 0;

    this.postLikeChanged.emit({
      postId: post.id,
      liked: !prevLiked,
      likes: prevLikes + (!prevLiked ? 1 : -1)
    });

    this.likeLoading.set(true);
    this.likesService.toggleLike(post.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.likeLoading.set(false);
          if (res.success && res.data) {
            this.postLikeChanged.emit({
              postId: post.id,
              liked: res.data.usuario_dio_like ?? false,
              likes: res.data.total_likes ?? 0
            });
          }
        },
        error: () => {
          this.likeLoading.set(false);
          this.postLikeChanged.emit({ postId: post.id, liked: prevLiked, likes: prevLikes });
        }
      });
  }

  toggleCommentsSection(): void {
    this.showComments.update(v => !v);
    if (this.showComments() && !this.commentsLoaded()) {
      this.cargarComentarios();
    }
  }

  private cargarComentarios(): void {
    if (this.loadingComments()) return;
    this.loadingComments.set(true);

    this.comentariosService.obtenerPorPublicacion(this.post().id, 50, 0)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          const list = Array.isArray(res) ? res : (res.data || []);
          const mapped = list.map((c: any) => ({
            id: c.id,
            author: c.nombre_completo || c.nombre_usuario || 'Usuario',
            avatar: Utils.obtenerIniciales(c.nombre_completo || c.nombre_usuario || 'U'),
            text: c.texto,
            time: Utils.formatearTiempo(c.fecha_creacion),
            avatarColor: Utils.generarColorAvatar(c.usuario_id, AVATAR_COLORS),
            usuario_id: c.usuario_id,
            foto_perfil_url: Utils.normalizarUrlImagen(c.foto_perfil_url || c.foto_perfil_s3 || '', this.apiBaseUrl),
            usandoIniciales: !(c.foto_perfil_url || c.foto_perfil_s3)
          }));
          this.comments.set(mapped);
          this.commentsLoaded.set(true);
          this.loadingComments.set(false);
          this.cdr.markForCheck();
        },
        error: () => {
          this.loadingComments.set(false);
          this.commentsLoaded.set(true);
        }
      });
  }

  addComment(): void {
    const text = this.commentInput().trim();
    if (!text || !this.autenticacionService.isAuthenticated()) {
      if (!this.autenticacionService.isAuthenticated()) this.router.navigate(['/login']);
      return;
    }

    this.comentariosService.crear({ publicacion_id: this.post().id, texto: text })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            const c = res.data;
            const nuevo: Comment = {
              id: c.id,
              author: c.nombre_completo || 'Tú',
              avatar: Utils.obtenerIniciales(c.nombre_completo || 'TU'),
              text: c.texto,
              time: 'Ahora',
              avatarColor: Utils.generarColorAvatar(c.usuario_id, AVATAR_COLORS),
              usuario_id: c.usuario_id,
              foto_perfil_url: Utils.normalizarUrlImagen(c.foto_perfil_url || '', this.apiBaseUrl),
              usandoIniciales: !c.foto_perfil_url
            };
            this.comments.update(list => [nuevo, ...list]);
            this.commentInput.set('');
            this.cdr.markForCheck();

            const censura = (res as any).censura;
            if (censura?.fue_censurado) this.mostrarAlertaCensura(censura);
          }
        }
      });
  }

  eliminarComentario(id: number): void {
    if (!confirm('¿Eliminar comentario?')) return;
    this.comentariosService.eliminar(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.comments.update(list => list.filter(c => c.id !== id));
            this.cdr.markForCheck();
          }
        }
      });
  }

  onCommentKeyPress(e: KeyboardEvent): void {
    if (e.key === 'Enter') this.addComment();
  }

  private mostrarAlertaCensura(censura: any): void {
    this.comentarioCensuradoMensaje.set(censura.mensaje_usuario || 'Moderación activa.');
    this.nivelCensura.set(censura.nivel || 'bajo');
    this.mostrandoAlertaCensura.set(true);
    setTimeout(() => this.mostrandoAlertaCensura.set(false), 5000);
  }

  cerrarAlertaCensura(): void {
    this.mostrandoAlertaCensura.set(false);
  }

  obtenerColorCensura(n: string): string {
    const colors: any = {
      bajo: 'bg-blue-50 border-blue-300 text-blue-800',
      medio: 'bg-yellow-50 border-yellow-300 text-yellow-800',
      alto: 'bg-red-50 border-red-300 text-red-800'
    };
    return colors[n] || 'bg-gray-50';
  }

  obtenerIconoCensura(n: string): string {
    return n === 'alto' ? '🚨' : n === 'medio' ? '⚠️' : '💬';
  }

  iniciarEdicion(e?: Event): void {
    e?.stopPropagation();
    if (this.post().usuario_id !== this.usuarioActualId()) return;
    this.isEditing.set(true);
    this.editedContent.set(this.post().content);
    this.showOptions.set(false);
  }

  cancelarEdicion(): void {
    this.isEditing.set(false);
  }

  guardarEdicion(): void {
    const text = this.editedContent().trim();
    if (!text || text === this.post().content) return this.cancelarEdicion();

    this.postEdited.emit({ postId: this.post().id, content: text });
    this.cancelarEdicion();
  }

  toggleOptions(e?: Event): void {
    e?.stopPropagation();
    this.showOptions.update(v => !v);
  }

  closeOptions(): void {
    this.showOptions.set(false);
  }

  openNoInteresaModal(e?: Event): void {
    e?.stopPropagation();
    this.closeOptions();
    this.postNoInteresa.emit(this.post().id);
  }

  ocultarPublicacion(e?: Event): void {
    e?.stopPropagation();
    if (confirm('¿Ocultar publicación?')) {
      this.closeOptions();
      this.postHidden.emit(this.post().id);
    }
  }

  openReportModal(e?: Event): void {
    e?.stopPropagation();
    this.closeOptions();
    this.postReported.emit(this.post().id);
  }

  eliminarPublicacion(e?: Event): void {
    e?.stopPropagation();
    if (confirm('¿Eliminar publicación?')) {
      this.closeOptions();
      this.postDeleted.emit(this.post().id);
    }
  }

  openShareModal(e?: Event): void {
    e?.stopPropagation();
    this.closeOptions();
    this.postShared.emit(this.post().id);
  }

  openPostDetail(): void {
    this.openPostDetailModal.emit(this.post().id);
  }

  formatearTamanoArchivo(b: number): string {
    return Utils.formatearTamanoArchivo(b);
  }

  obtenerExtensionArchivo(n: string): string {
    return Utils.obtenerExtensionArchivo(n);
  }

  descargarDocumento(url: string, n: string): void {
    const a = document.createElement('a');
    a.href = url;
    a.download = n;
    a.click();
  }

  getThemeRingColor(): string {
    const colors: any = {
      default: '#f97316', midnight: '#6366f1', forest: '#10b981',
      neon: '#0ff', toxic: '#84cc16', candy: '#ec4899'
    };
    return colors[this.currentTheme().id] || '#f97316';
  }

  trackByCommentId(i: number, c: Comment): number {
    return c.id;
  }

  handleImageError(c: Comment): void {
    c.usandoIniciales = true;
    c.foto_perfil_url = null;
    this.cdr.markForCheck();
  }
}