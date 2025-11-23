import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AutenticacionService } from '../../core/servicios/autenticacion/autenticacion';
import { Comentario, ComentariosService } from '../../core/servicios/comentarios/comentarios';
import { FotosService } from '../../core/servicios/fotos/fotos';
import { Theme, ThemeService } from '../../core/servicios/temas';

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
  canDelete?: boolean;
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
  usuarioId?: number;
  usuario_id?: number;
  profileImageUrl?: string | null;
}

@Component({
  selector: 'app-detalle-post',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './detalle-post.html',
  styleUrl: './detalle-post.css'
})
export class DetallePost implements OnInit, OnDestroy {
  private _post: Post | null = null;
  private _isVisible: boolean = false;
  private usuarioActualId: number | null = null;
  
  @Input() set post(value: Post | null) {
    this._post = value;
    this.verificarYCargarComentarios();
  }
  
  get post(): Post | null {
    return this._post;
  }

  @Input() set isVisible(value: boolean) {
    this._isVisible = value;
    
    if (value) {
      this.verificarYCargarComentarios();
    } else {
      this.detenerRefrescoAutomatico();
    }
  }
  
  get isVisible(): boolean {
    return this._isVisible;
  }

  @Input() fotosPerfilCache = new Map<number, string | null>();

  @Output() close = new EventEmitter<void>();
  @Output() likeToggled = new EventEmitter<number>();

  commentInput: string = '';
  showFullDescription = false;
  showFullDescriptionMobile = false;
  
  showShareModal: boolean = false;
  linkCopied: boolean = false;

  comentariosAPI: Comentario[] = [];
  comentariosFormateados: Comment[] = [];
  comentariosLoading: boolean = false;
  comentariosError: string | null = null;
  private refreshInterval: any = null;
  private ultimaActualizacion: number = 0;
  private postIdActual: number | null = null;

  currentTheme: Theme;
  private themeSubscription?: Subscription;

  constructor(
    private themeService: ThemeService,
    private comentariosService: ComentariosService,
    private autenticacionService: AutenticacionService,
    private fotosService: FotosService,
    private cdr: ChangeDetectorRef,
    private router: Router
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
    this.detenerRefrescoAutomatico();
  }

  navegarAPerfil(usuarioId: number | undefined, event?: Event): void {
    event?.stopPropagation();
    
    if (!usuarioId) {
      return;
    }

    this.router.navigate(['/perfil', usuarioId]);
  }

  private verificarYCargarComentarios(): void {
    if (this._post && this._isVisible) {
      if (this.postIdActual !== this._post.id) {
        this.comentariosAPI = [];
        this.comentariosFormateados = [];
        this.postIdActual = this._post.id;
      }
      
      this.cargarComentarios();
    }
  }

  cargarComentarios(): void {
    if (!this.post) {
      return;
    }

    if (this.comentariosLoading) {
      return;
    }

    this.comentariosLoading = true;
    this.comentariosError = null;

    const publicacionId = this.post.id;

    this.comentariosService.obtenerPorPublicacion(publicacionId, 50, 0)
      .subscribe({
        next: (comentarios) => {
          if (Array.isArray(comentarios) && comentarios.length > 0) {
            const usuariosIds = [...new Set(comentarios.map(c => c.usuario_id))];

            this.cargarFotosPerfilBatch(usuariosIds, () => {
              this.comentariosAPI = comentarios;
              this.comentariosFormateados = comentarios.map(c => {
                const fotoPerfil = this.obtenerFotoPerfilDesdeCache(c.usuario_id);
                const tieneFoto = fotoPerfil !== null && fotoPerfil !== undefined && fotoPerfil.trim() !== '';
                
                const comentarioMapeado: Comment = {
                  id: c.id,
                  author: c.nombre_completo || c.nombre_usuario || 'Usuario',
                  avatar: this.generarAvatarIniciales(c.nombre_completo || c.nombre_usuario || 'U'),
                  text: c.texto,
                  time: this.formatearTiempo(c.fecha_creacion),
                  avatarColor: this.generarColorAvatar(c.usuario_id),
                  usuario_id: c.usuario_id,
                  foto_perfil_url: tieneFoto ? fotoPerfil : null,
                  usandoIniciales: !tieneFoto,
                  canDelete: c.usuario_id === this.usuarioActualId
                };
                
                return comentarioMapeado;
              });

              this.ultimaActualizacion = Date.now();
              this.comentariosLoading = false;
              
              this.cdr.markForCheck();
              this.cdr.detectChanges();
              
              requestAnimationFrame(() => {
                this.cdr.detectChanges();
              });
            });
          } else {
            this.comentariosAPI = [];
            this.comentariosFormateados = [];
            this.comentariosLoading = false;
          }
        },
        error: (error) => {
          this.comentariosError = 'No se pudieron cargar los comentarios';
          this.comentariosAPI = [];
          this.comentariosFormateados = [];
          this.comentariosLoading = false;
        }
      });
  }

  private cargarFotosPerfilBatch(usuariosIds: number[], callback?: () => void): void {
    const idsNoEnCache = usuariosIds.filter(id => !this.fotosPerfilCache.has(id));

    if (idsNoEnCache.length === 0) {
      if (callback) callback();
      return;
    }

    this.fotosService.obtenerFotosBatch(idsNoEnCache)
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

  private detenerRefrescoAutomatico(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  obtenerComentariosFormateados(): Comment[] {
    return this.comentariosFormateados;
  }

  private generarAvatarIniciales(nombre: string): string {
    if (!nombre) return 'U';
    const palabras = nombre.trim().split(' ');
    return palabras.length >= 2
      ? (palabras[0][0] + palabras[1][0]).toUpperCase()
      : nombre.substring(0, 2).toUpperCase();
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

  private formatearTiempo(fecha: string): string {
    const ahora = new Date();
    const fecha_comentario = new Date(fecha);
    const diferencia = ahora.getTime() - fecha_comentario.getTime();

    const minutos = Math.floor(diferencia / 60000);
    const horas = Math.floor(diferencia / 3600000);
    const dias = Math.floor(diferencia / 86400000);

    if (minutos < 1) return 'Hace unos segundos';
    if (minutos < 60) return `Hace ${minutos} min`;
    if (horas < 24) return `Hace ${horas}h`;
    if (dias < 7) return `Hace ${dias}d`;

    return fecha_comentario.toLocaleDateString('es-ES');
  }

  closeModal(): void {
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.closeModal();
    }
  }

  // ⭐ LÓGICA DE LIKE ACTUALIZADA (igual a publicaciones-perfil)
  toggleLike(): void {
    if (!this.post) return;

    // Toggle local del estado
    this.post.liked = !this.post.liked;
    this.post.likes += this.post.liked ? 1 : -1;

    // Emitir evento al componente padre
    this.likeToggled.emit(this.post.id);

    // Detectar cambios
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }

  // ⭐ AGREGAR COMENTARIO (mejorado)
  addComment(): void {
    const text = this.commentInput.trim();
    if (!text || !this.post) return;

    this.comentariosService.crear({
      publicacion_id: this.post.id,
      texto: text
    }).subscribe({
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
            avatar: this.generarAvatarIniciales(response.data.nombre_completo || response.data.nombre_usuario),
            text: response.data.texto,
            time: 'Ahora',
            avatarColor: this.generarColorAvatar(response.data.usuario_id),
            usuario_id: response.data.usuario_id,
            foto_perfil_url: tieneFoto ? fotoPerfilUrl : null,
            usandoIniciales: !tieneFoto,
            canDelete: true
          };

          this.comentariosFormateados.unshift(nuevoComentario);
          this.commentInput = '';

          this.cdr.markForCheck();
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        alert('Error al agregar el comentario');
      }
    });
  }

  // ⭐ ELIMINAR COMENTARIO
  eliminarComentario(comentarioId: number): void {
    const comentario = this.comentariosFormateados.find(c => c.id === comentarioId);
    if (!comentario || !comentario.canDelete) {
      alert('No tienes permiso para eliminar este comentario');
      return;
    }

    if (!confirm('¿Estás seguro de que quieres eliminar este comentario?')) return;

    this.comentariosService.eliminar(comentarioId).subscribe({
      next: (response) => {
        if (response.success) {
          this.comentariosFormateados = this.comentariosFormateados.filter(c => c.id !== comentarioId);
          this.cdr.markForCheck();
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        alert('Error al eliminar el comentario');
      }
    });
  }

  onCommentKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.addComment();
    }
  }

  openShareModal(): void {
    if (this.post) {
      this.showShareModal = true;
      document.body.style.overflow = 'hidden';
    }
  }

  closeShareModal(): void {
    this.showShareModal = false;
    document.body.style.overflow = 'auto';
  }

  onShareBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('share-modal-backdrop')) {
      this.closeShareModal();
    }
  }

  shareToSocial(platform: string): void {
    const postUrl = `http://3.146.83.30:4200/principal/post/${this.post?.id}`;
    const text = this.post?.content || '';

    let shareUrl = '';

    switch (platform) {
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
      this.closeShareModal();
    }
  }

  copyLink(): void {
    const postUrl = `http://3.146.83.30:4200/principal/post/${this.post?.id}`;
    navigator.clipboard.writeText(postUrl).then(() => {
      this.linkCopied = true;
      setTimeout(() => {
        this.linkCopied = false;
      }, 2000);
    });
  }

  handleImageError(comment: Comment): void {
    comment.usandoIniciales = true;
    comment.foto_perfil_url = null;
    this.cdr.detectChanges();
  }

  onImageLoad(comment: Comment): void {
    // Imagen cargada correctamente
  }

  trackByCommentId(index: number, comment: Comment): number {
    return comment.id;
  }
}