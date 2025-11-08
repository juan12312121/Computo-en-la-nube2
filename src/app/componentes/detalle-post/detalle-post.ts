import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AutenticacionService } from '../../core/servicios/autenticacion/autenticacion';
import { Comentario, ComentariosService } from '../../core/servicios/comentarios/comentarios';
import { Theme, ThemeService } from '../../core/servicios/temas';

interface Comment {
  id: number;
  author: string;
  avatar: string;
  text: string;
  time: string;
  avatarColor: string;
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
  
  @Input() set post(value: Post | null) {
    console.log('🔄 Post actualizado:', value?.id);
    this._post = value;
    this.verificarYCargarComentarios();
  }
  
  get post(): Post | null {
    return this._post;
  }

  @Input() set isVisible(value: boolean) {
    console.log('👁️ Visibilidad cambió a:', value);
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

  /**
   * Verificar si tanto post como isVisible están listos para cargar comentarios
   */
  private verificarYCargarComentarios(): void {
    console.log('🔍 Verificando: Post =', this._post?.id, ', isVisible =', this._isVisible);
    if (this._post && this._isVisible) {
      // Si el post cambió, limpiar comentarios antiguos
      if (this.postIdActual !== this._post.id) {
        console.log('📝 Post diferente, limpiando comentarios antiguos');
        this.comentariosAPI = [];
        this.comentariosFormateados = [];
        this.postIdActual = this._post.id;
      }
      
      console.log('✅ Condiciones met, cargando comentarios');
      this.cargarComentarios();
    }
  }

  @Output() close = new EventEmitter<void>();
  @Output() likeToggled = new EventEmitter<number>();

  commentInput: string = '';
  showFullDescription = false;
  showFullDescriptionMobile = false;
  
  // Variables del modal de compartir
  showShareModal: boolean = false;
  linkCopied: boolean = false;

  // Comentarios
  comentariosAPI: Comentario[] = [];
  comentariosFormateados: Comment[] = [];
  comentariosLoading: boolean = false;
  comentariosError: string | null = null;
  private refreshInterval: any = null;
  private ultimaActualizacion: number = 0;
  private postIdActual: number | null = null;

  // Theme support
  currentTheme: Theme;
  private themeSubscription?: Subscription;

  constructor(
    private themeService: ThemeService,
    private comentariosService: ComentariosService,
    private autenticacionService: AutenticacionService
  ) {
    this.currentTheme = this.themeService.getCurrentTheme();
  }

  ngOnInit(): void {
    this.themeSubscription = this.themeService.currentTheme$.subscribe(theme => {
      this.currentTheme = theme;
    });
    
    // ngOnInit no carga comentarios, espera a que se establezcan los @Input
  }

  ngOnDestroy(): void {
    this.themeSubscription?.unsubscribe();
    this.detenerRefrescoAutomatico();
  }

  /**
   * Cargar comentarios de la publicación desde la API
   */
  cargarComentarios(): void {
    if (!this.post) {
      console.error('❌ No hay post disponible');
      return;
    }

    // Evitar cargas simultáneas
    if (this.comentariosLoading) {
      console.log('⏳ Ya hay una carga en progreso, evitando duplicada');
      return;
    }

    this.comentariosLoading = true;
    this.comentariosError = null;

    const publicacionId = this.post.id;
    console.log('📥 Cargando comentarios para publicación ID:', publicacionId);

    this.comentariosService.obtenerPorPublicacion(publicacionId, 50, 0)
      .subscribe({
        next: (response) => {
          console.log('✅ Respuesta de API recibida:', response);
          console.log('📊 Total de comentarios en respuesta:', response.data ? response.data.length : 0);
          
          if (response.success && response.data) {
            this.comentariosAPI = response.data;
            this.comentariosFormateados = this.formatearComentarios();
            this.ultimaActualizacion = Date.now();
            
            console.log('🎨 Comentarios formateados:', this.comentariosFormateados.length);
          } else {
            console.warn('⚠️ Respuesta sin datos válidos');
          }
          this.comentariosLoading = false;
        },
        error: (error) => {
          console.error('❌ Error en la solicitud HTTP:', error);
          this.comentariosError = 'No se pudieron cargar los comentarios';
          this.comentariosLoading = false;
        }
      });
  }

  /**
   * Iniciar refresco automático de comentarios cada 5 segundos
   */
  private iniciarRefrescoAutomatico(): void {
    // Refresco automático deshabilitado
  }

  /**
   * Detener refresco automático
   */
  private detenerRefrescoAutomatico(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  /**
   * Formatear comentarios de la API al formato del componente
   */
  private formatearComentarios(): Comment[] {
    const formateados = this.comentariosAPI.map(com => {
      const comentarioFormateado = {
        id: com.id,
        author: com.nombre_completo || com.nombre_usuario,
        avatar: this.generarAvatarIniciales(com.nombre_completo || com.nombre_usuario),
        text: com.texto,
        time: this.formatearTiempo(com.fecha_creacion),
        avatarColor: this.generarColorAvatar(com.usuario_id)
      };
      
      console.log('🔄 Formateando comentario:', {
        original: com,
        formateado: comentarioFormateado
      });
      
      return comentarioFormateado;
    });
    
    return formateados;
  }

  /**
   * Mapear comentarios de la API al formato del componente
   */
  obtenerComentariosFormateados(): Comment[] {
    return this.comentariosFormateados;
  }

  /**
   * Generar iniciales para el avatar
   */
  private generarAvatarIniciales(nombre: string): string {
    return nombre
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  /**
   * Generar color consistente basado en el ID del usuario
   */
  private generarColorAvatar(usuarioId: number): string {
    const colores = [
      'from-orange-400 to-orange-600',
      'from-purple-400 to-purple-600',
      'from-blue-400 to-blue-600',
      'from-pink-400 to-pink-600',
      'from-green-400 to-green-600',
      'from-teal-400 to-teal-600',
      'from-red-400 to-red-600',
      'from-yellow-400 to-yellow-600'
    ];
    return colores[usuarioId % colores.length];
  }

  /**
   * Formatear tiempo relativo
   */
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

  toggleLike(): void {
    if (this.post) {
      this.likeToggled.emit(this.post.id);
    }
  }

  addComment(): void {
    const text = this.commentInput.trim();
    if (!text || !this.post) return;

    this.comentariosService.crear({
      publicacion_id: this.post.id,
      texto: text
    }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          console.log('✅ Comentario creado exitosamente');
          
          // Agregar comentario nuevo a la lista localmente
          const nuevoComentario: Comment = {
            id: response.data.id,
            author: response.data.nombre_completo || response.data.nombre_usuario,
            avatar: this.generarAvatarIniciales(response.data.nombre_completo || response.data.nombre_usuario),
            text: response.data.texto,
            time: 'Ahora',
            avatarColor: this.generarColorAvatar(response.data.usuario_id)
          };
          
          // Insertar al principio de la lista
          this.comentariosFormateados.unshift(nuevoComentario);
          this.commentInput = '';
          
          console.log('✨ Comentario agregado a la lista local. Total:', this.comentariosFormateados.length);
        }
      },
      error: (error) => {
        console.error('❌ Error al agregar comentario:', error);
        alert('Error al agregar el comentario');
      }
    });
  }

  onCommentKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
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
    const postUrl = `https://redstudent.com/post/${this.post?.id}`;
    const text = this.post?.content || '';

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
      this.closeShareModal();
    }
  }

  copyLink(): void {
    const postUrl = `https://redstudent.com/post/${this.post?.id}`;
    navigator.clipboard.writeText(postUrl).then(() => {
      this.linkCopied = true;
      setTimeout(() => {
        this.linkCopied = false;
      }, 2000);
    });
  }

  /**
   * TrackBy para optimizar el rendering de comentarios en ngFor
   */
  trackByCommentId(index: number, comment: Comment): number {
    return comment.id;
  }
}