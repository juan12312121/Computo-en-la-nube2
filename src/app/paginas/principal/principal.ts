import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { DetallePost } from '../../componentes/detalle-post/detalle-post';
import { Navbar } from '../../componentes/navbar/navbar';
import { AutenticacionService } from '../../core/servicios/autenticacion/autenticacion';
import { NoMeInteresaService } from '../../core/servicios/no-me-interesa/no-me-interesa';
import { PublicacionesOcultasService } from '../../core/servicios/ocultas/ocultas';
import { PublicacionesService } from '../../core/servicios/publicaciones/publicaciones';
import { ReportesService } from '../../core/servicios/reportes/reportes';
import { SeguidorService } from '../../core/servicios/seguidores/seguidores';
import { Theme, ThemeService } from '../../core/servicios/temas';
import { FotosService } from '../../core/servicios/fotos/fotos';
import { SidebarPerfil } from '../../componentes/sidebar-perfil/sidebar-perfil';
import { SidebarCategorias } from '../../componentes/sidebar-categorias/sidebar-categorias';
import { SidebarUsuariosActivos } from '../../componentes/sidebar-usuarios-activos/sidebar-usuarios-activos';
import { AppSidebarSugerencias } from '../../componentes/app-sidebar-sugerencias/app-sidebar-sugerencias';
import { AppModalNoInteresa } from '../../componentes/app-modal-no-interesa/app-modal-no-interesa';
import { ModalReporte } from '../../componentes/modal-reporte/modal-reporte';
import { ModalCompartir } from '../../componentes/modal-compartir/modal-compartir';
import { PostCard } from '../../componentes/post-card/post-card';

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
  comments: any[];
  usuarioId?: number;
  totalComments?: number;
  documentos?: any[];
  visibilidad?: 'publico' | 'seguidores' | 'privado';
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
  imports: [
    CommonModule, FormsModule, Navbar, DetallePost,
    SidebarPerfil, SidebarCategorias, SidebarUsuariosActivos,
    AppSidebarSugerencias, AppModalNoInteresa, ModalReporte,
    ModalCompartir, PostCard
  ],
  templateUrl: './principal.html',
  styleUrls: ['./principal.css']
})
export class Principal implements OnInit, OnDestroy {
  @ViewChild(AppSidebarSugerencias) sidebarSugerencias?: AppSidebarSugerencias;

  posts: Post[] = [];
  currentTheme!: Theme;
  usuarioActualId: number | null = null;
  usuarioActual: any = null;
  usuariosActivos: any[] = [];
  isLoading = true;
  errorMessage = '';
  
  categoriaSeleccionada: string | null = null;
  publicacionesOcultas = new Set<number>();
  publicacionesNoInteresan = new Set<number>();
  seguidosIds = new Set<number>();
  fotosPerfilCache = new Map<number, string | null>();

  showPostDetailModal = false;
  showShareModal = false;
  showReportModal = false;
  showNoInteresaModal = false;
  selectedPost: Post | null = null;
  sharePostId: number | null = null;
  reportPostId: number | null = null;
  noInteresaPostId: number | null = null;
  
  linkCopied = false;
  reportMotivo = '';
  reportDescripcion = '';
  reportLoading = false;
  reportSuccess = false;
  reportError = '';
  noInteresaLoading = false;
  noInteresaSuccess = false;
  noInteresaError = '';

  categoriasDisponibles = [
    { nombre: 'General', icon: 'fa-home', color: 'text-orange-500', filtro: 'General' },
    { nombre: 'Tecnología', icon: 'fa-laptop-code', color: 'text-blue-500', filtro: 'Tecnología' },
    { nombre: 'Ciencias', icon: 'fa-flask', color: 'text-purple-500', filtro: 'Ciencias' },
    { nombre: 'Artes y Cultura', icon: 'fa-palette', color: 'text-pink-500', filtro: 'Artes y Cultura' },
    { nombre: 'Deportes', icon: 'fa-futbol', color: 'text-green-500', filtro: 'Deportes' },
    { nombre: 'Salud y Bienestar', icon: 'fa-heartbeat', color: 'text-green-500', filtro: 'Salud y Bienestar' },
    { nombre: 'Vida Universitaria', icon: 'fa-graduation-cap', color: 'text-orange-600', filtro: 'Vida Universitaria' },
    { nombre: 'Opinión', icon: 'fa-comments', color: 'text-indigo-500', filtro: 'Opinión' },
    { nombre: 'Entrevistas', icon: 'fa-microphone', color: 'text-yellow-500', filtro: 'Entrevistas' }
  ];

  private destroy$ = new Subject<void>();
  public readonly apiBaseUrl = window.location.hostname === 'localhost'
    ? 'http://localhost:3000' : 'http://3.146.83.30:3000';

  constructor(
    private themeService: ThemeService,
    private publicacionesService: PublicacionesService,
    private seguidorService: SeguidorService,
    private autenticacionService: AutenticacionService,
    private reportesService: ReportesService,
    private publicacionesOcultasService: PublicacionesOcultasService,
    private noMeInteresaService: NoMeInteresaService,
    private route: ActivatedRoute,
    private fotosService: FotosService,
    private router: Router
  ) {
    this.currentTheme = this.themeService.getCurrentTheme();
  }

  ngOnInit(): void {
    this.themeService.currentTheme$
      .pipe(takeUntil(this.destroy$))
      .subscribe(theme => this.currentTheme = theme);

    this.usuarioActualId = this.obtenerUsuarioActualId();
    
    this.cargarDatosUsuarioActual();
    this.cargarUsuariosActivosEstatico();
    this.inicializarFeed();

    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        if (params['id']) {
          this.abrirPostDesdeURL(Number(params['id']));
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
    } catch (error) {
      this.errorMessage = 'Error al cargar el contenido';
    } finally {
      this.isLoading = false;
    }
  }

  private cargarMarcasUsuario(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.autenticacionService.isAuthenticated()) {
        return resolve();
      }

      let completadas = 0;
      const verificarCompleto = () => {
        completadas++;
        if (completadas === 2) resolve();
      };

      this.publicacionesOcultasService.obtenerPublicacionesOcultas()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            if (res.success && Array.isArray(res.data)) {
              this.publicacionesOcultas = new Set(res.data.map(p => p.id));
            }
            verificarCompleto();
          },
          error: () => verificarCompleto()
        });

      this.noMeInteresaService.obtenerPublicacionesNoInteresan()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            if (res.success && Array.isArray(res.data)) {
              this.publicacionesNoInteresan = new Set(res.data.map(p => p.id));
            }
            verificarCompleto();
          },
          error: () => verificarCompleto()
        });
    });
  }

  private cargarFeed(): Promise<void> {
    return new Promise((resolve) => {
      this.publicacionesService.obtenerPublicaciones()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            if (!res.success || !Array.isArray(res.data)) {
              this.posts = [];
              return resolve();
            }

            const publicacionesFiltradas = res.data.filter(pub => {
              const esOculta = this.publicacionesOcultas.has(pub.id);
              const esNoInteresa = this.publicacionesNoInteresan.has(pub.id);
              return !esOculta && !esNoInteresa;
            });

            const postsConvertidos = this.convertirPublicacionesAPosts(publicacionesFiltradas);
            const postsVisibles = this.filtrarPorVisibilidad(postsConvertidos);
            
            this.posts = this.organizarPosts(postsVisibles);
            resolve();
          },
          error: () => {
            this.posts = [];
            resolve();
          }
        });
    });
  }

  private organizarPosts(posts: Post[]): Post[] {
    const mias = posts.filter(p => p.usuarioId === this.usuarioActualId);
    const seguidos = posts.filter(p => p.usuarioId && this.seguidosIds.has(p.usuarioId));
    const otros = posts.filter(p =>
      p.usuarioId !== this.usuarioActualId &&
      !this.seguidosIds.has(p.usuarioId!)
    );

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
    const posts = pubs.map(p => {
      const visibilidad = p.visibilidad || 'publico';
      
      return {
        id: p.id,
        author: p.nombre_completo || p.nombre_usuario || 'Usuario',
        avatar: this.obtenerIniciales(p.nombre_completo || p.nombre_usuario || 'U'),
        time: this.formatearTiempo(p.fecha_creacion),
        content: p.contenido || '',
        image: this.normalizarUrlImagen(p.imagen_s3 || p.imagen_url || ''),
        category: p.categoria || 'General',
        categoryColor: p.color_categoria || this.publicacionesService.obtenerColorCategoria(p.categoria || 'General'),
        likes: p.total_likes ?? p.likes ?? 0,
        liked: false,
        shares: p.total_compartidos ?? p.compartidos ?? 0,
        avatarColor: this.generarColorAvatar(p.usuario_id),
        comments: [],
        usuarioId: p.usuario_id,
        totalComments: p.total_comentarios ?? p.comentarios ?? 0,
        documentos: p.documentos || [],
        visibilidad: visibilidad
      };
    }).filter(p => p.id && p.usuarioId);
    
    return posts;
  }

  private filtrarPorVisibilidad(posts: Post[]): Post[] {
    const postsVisibles = posts.filter(post => {
      const visibilidad = post.visibilidad || 'publico';
      const esAutor = post.usuarioId === this.usuarioActualId;
      const siguoAlAutor = post.usuarioId ? this.seguidosIds.has(post.usuarioId) : false;

      if (esAutor) {
        return true;
      }
      
      switch (visibilidad) {
        case 'publico':
          return true;
        
        case 'seguidores':
          return this.usuarioActualId && siguoAlAutor;
        
        case 'privado':
          return false;
        
        default:
          return true;
      }
    });
    
    return postsVisibles;
  }

  // ========== EVENTOS DEL POST-CARD ==========
  onPostLikeChanged(data: { postId: number; liked: boolean; likes: number }): void {
    const post = this.posts.find(p => p.id === data.postId);
    if (post) {
      post.liked = data.liked;
      post.likes = data.likes;
    }
  }

  onPostHidden(postId: number): void {
    this.publicacionesOcultasService.ocultarPublicacion(postId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.publicacionesOcultas.add(postId);
            this.posts = this.posts.filter(p => p.id !== postId);
            alert('✅ Publicación ocultada correctamente');
          }
        },
        error: () => alert('Error al ocultar publicación')
      });
  }

  onPostNoInteresa(postId: number): void {
    this.noInteresaPostId = postId;
    this.showNoInteresaModal = true;
    this.noInteresaError = '';
    this.noInteresaSuccess = false;
    document.body.style.overflow = 'hidden';
  }

  onPostReported(postId: number): void {
    this.reportPostId = postId;
    this.showReportModal = true;
    this.reportMotivo = '';
    this.reportDescripcion = '';
    this.reportError = '';
    this.reportSuccess = false;
    document.body.style.overflow = 'hidden';
  }

  onPostShared(postId: number): void {
    this.sharePostId = postId;
    this.showShareModal = true;
    this.linkCopied = false;
    document.body.style.overflow = 'hidden';
  }

  onPostEdited(data: { postId: number; content: string }): void {
    const formData = new FormData();
    formData.append('contenido', data.content);
    
    this.publicacionesService.actualizarPublicacion(data.postId, formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            const post = this.posts.find(p => p.id === data.postId);
            if (post) post.content = data.content;
            alert('✅ Publicación actualizada');
          }
        },
        error: () => alert('Error al actualizar publicación')
      });
  }

  onPostDeleted(postId: number): void {
    this.publicacionesService.eliminarPublicacion(postId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.posts = this.posts.filter(p => p.id !== postId);
            alert('✅ Publicación eliminada');
          }
        },
        error: () => alert('Error al eliminar publicación')
      });
  }

  onOpenPostDetailModal(postId: number): void {
    const post = this.posts.find(p => p.id === postId);
    if (post) {
      this.selectedPost = post;
      this.showPostDetailModal = true;
      document.body.style.overflow = 'hidden';
    }
  }

  // ========== MODALES ==========
  closePostDetail(): void {
    this.showPostDetailModal = false;
    this.selectedPost = null;
    document.body.style.overflow = 'auto';
  }

  closeShareModal(): void {
    this.showShareModal = false;
    this.sharePostId = null;
    document.body.style.overflow = 'auto';
  }

  shareToSocial(platform: string): void {
    const post = this.posts.find(p => p.id === this.sharePostId);
    if (!post) return;

    const url = `http://3.146.83.30:4200/principal/post/${post.id}`;
    const shareUrl = SHARE_URLS[platform]?.(url, post.content || '');

    if (shareUrl) {
      window.open(shareUrl, '_blank');
      post.shares++;
    }
  }

  copyLink(): void {
    const url = `http://3.146.83.30:4200/principal/post/${this.sharePostId}`;
    navigator.clipboard.writeText(url).then(() => {
      this.linkCopied = true;
      setTimeout(() => this.linkCopied = false, 2000);
    });
  }

  closeReportModal(): void {
    this.showReportModal = false;
    this.reportPostId = null;
    document.body.style.overflow = 'auto';
  }

  submitReport(): void {
    if (!this.reportPostId || !this.reportMotivo.trim()) {
      this.reportError = 'Debes seleccionar un motivo';
      return;
    }

    this.reportLoading = true;
    this.reportError = '';

    this.reportesService.crearReporte({
      publicacionId: this.reportPostId,
      motivo: this.reportMotivo,
      descripcion: this.reportDescripcion.trim() || undefined
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.reportLoading = false;
          if (res.success) {
            this.reportSuccess = true;
            setTimeout(() => this.closeReportModal(), 2000);
          } else {
            this.reportError = res.message || 'Error al crear el reporte';
          }
        },
        error: () => {
          this.reportLoading = false;
          this.reportError = 'Error al enviar el reporte';
        }
      });
  }

  closeNoInteresaModal(): void {
    this.showNoInteresaModal = false;
    this.noInteresaPostId = null;
    document.body.style.overflow = 'auto';
  }

  submitNoInteresa(): void {
    if (!this.noInteresaPostId) return;

    this.noInteresaLoading = true;
    this.noMeInteresaService.marcarNoInteresa(this.noInteresaPostId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.noInteresaLoading = false;
          if (res.success) {
            this.noInteresaSuccess = true;
            this.publicacionesNoInteresan.add(this.noInteresaPostId!);
            this.posts = this.posts.filter(p => p.id !== this.noInteresaPostId);
            setTimeout(() => this.closeNoInteresaModal(), 2000);
          } else {
            this.noInteresaError = res.message || 'Error';
          }
        },
        error: () => {
          this.noInteresaLoading = false;
          this.noInteresaError = 'Error al marcar como "No me interesa"';
        }
      });
  }

  // ========== FILTROS Y SEGUIDOS ==========
  filtrarPorCategoria(categoria: string): void {
    this.categoriaSeleccionada = this.categoriaSeleccionada === categoria ? null : categoria;
  }

  get postsFiltrados(): Post[] {
    let resultado = this.posts;
    
    if (this.categoriaSeleccionada) {
      resultado = resultado.filter(p => 
        p.category.toLowerCase() === this.categoriaSeleccionada!.toLowerCase()
      );
    }
    
    return resultado;
  }

  seguirUsuario(usuarioId: number): void {
    if (!this.autenticacionService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    this.seguidorService.seguir(usuarioId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.seguidosIds.add(usuarioId);
            setTimeout(() => this.sidebarSugerencias?.recargarSugerencias(), 1000);
            alert('✅ Ahora sigues a este usuario');
          }
        },
        error: () => alert('Error al seguir usuario')
      });
  }

  private cargarSeguidos(): Promise<void> {
    return new Promise(resolve => {
      if (!this.usuarioActualId) {
        return resolve();
      }

      this.seguidorService.listarSeguidos(this.usuarioActualId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            if (res.success && res.data?.seguidos) {
              const seguidos = res.data.seguidos.map((u: any) => u.id);
              this.seguidosIds = new Set(seguidos);
            } else {
              this.seguidosIds = new Set();
            }
            resolve();
          },
          error: () => {
            this.seguidosIds = new Set();
            resolve();
          }
        });
    });
  }

  // ========== UTILIDADES ==========
  onPublicacionCreada(publicacionData: any): void {
    if (!publicacionData) return;

    const nuevaPublicacion: Post = {
      id: publicacionData.id,
      author: publicacionData.nombre_completo || 'Usuario',
      avatar: this.obtenerIniciales(publicacionData.nombre_completo || 'U'),
      time: 'Ahora',
      content: publicacionData.contenido || '',
      image: this.normalizarUrlImagen(publicacionData.imagen_s3 || ''),
      category: publicacionData.categoria || 'General',
      categoryColor: this.publicacionesService.obtenerColorCategoria(publicacionData.categoria || 'General'),
      likes: 0,
      liked: false,
      shares: 0,
      avatarColor: this.generarColorAvatar(publicacionData.usuario_id),
      comments: [],
      usuarioId: publicacionData.usuario_id,
      totalComments: 0,
      documentos: publicacionData.documentos || [],
      visibilidad: publicacionData.visibilidad || 'publico'
    };

    this.posts.unshift(nuevaPublicacion);
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
  }

  private abrirPostDesdeURL(postId: number): void {
    const intentar = (intentos = 0) => {
      if (intentos > 20) return;
      const post = this.posts.find(p => p.id === postId);
      if (post) {
        setTimeout(() => this.onOpenPostDetailModal(postId), 100);
      } else if (this.isLoading) {
        setTimeout(() => intentar(intentos + 1), 200);
      }
    };
    intentar();
  }

  private cargarDatosUsuarioActual(): void {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        this.usuarioActual = JSON.parse(userStr);
      } catch (error) {
        console.error('Error al parsear usuario actual');
      }
    }
  }

  private cargarUsuariosActivosEstatico(): void {
    this.usuariosActivos = [
      {
        id: 2,
        nombre_usuario: 'elasaltacunas',
        nombre_completo: 'Jesus Ayala',
        foto_perfil_url: null,
        carrera: 'Licenciatura en levantar culitos en el gym',
        total_seguidores: 45,
        estaConectado: true
      },
      {
        id: 3,
        nombre_usuario: 'Juan',
        nombre_completo: 'Campos',
        foto_perfil_url: null,
        carrera: 'Ingeniería en Software',
        total_seguidores: 23,
        estaConectado: true
      }
    ];
  }

  obtenerUsuarioActualId(): number | null {
    const user = localStorage.getItem('currentUser');
    if (!user) return null;
    try {
      return JSON.parse(user).id;
    } catch {
      return null;
    }
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

  private normalizarUrlImagen(url: string): string | null {
    if (!url || url.includes('/undefined')) return null;
    if (url.includes('s3.us-east-2.amazonaws.com') || url.includes('s3.amazonaws.com')) return url;
    if (url.startsWith('http')) return url;
    if (url.startsWith('/uploads/')) return `${this.apiBaseUrl}${url}`;
    if (!url.includes('/')) return `${this.apiBaseUrl}/uploads/publicaciones/${url}`;
    return `${this.apiBaseUrl}${url}`;
  }

  generarColorAvatar(id: number): string {
    return AVATAR_COLORS[id % AVATAR_COLORS.length];
  }

  obtenerMotivosValidos(): string[] {
    return this.reportesService.obtenerMotivosValidos();
  }

  get currentThemeData(): any {
    return this.currentTheme;
  }

  trackByPostId(index: number, post: Post): number {
    return post.id;
  }

  onSugerenciasCargadas(cantidad: number): void {}
}