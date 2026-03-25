import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, OnDestroy, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Navbar } from '../../componentes/navbar/navbar';
import { AutenticacionService } from '../../core/servicios/autenticacion/autenticacion';
import { LikesService } from '../../core/servicios/likes/likes';
import { Publicacion } from '../../core/modelos/publicacion.model';
import { PublicacionesService } from '../../core/servicios/publicaciones/publicaciones';
import { Theme, ThemeService } from '../../core/servicios/temas';
import { FotosService } from '../../core/servicios/fotos/fotos';
import { DetallePost } from '../../componentes/detalle-post/detalle-post';
import { SharingService } from '../../core/servicios/sharing/sharing';
import { environment } from '../../../environments/environment';

// ========== INTERFACES ==========
interface Tag {
  name: string;
  icon: string;
  color: string;
  posts: number;
  trending: boolean;
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
  comments: any[];
  usuario_id?: number;
  totalComments?: number;
  likeLoading?: boolean;
  fotoPerfil?: string | null;
  [key: string]: any;
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

@Component({
  selector: 'app-explorar',
  imports: [CommonModule, FormsModule, Navbar, DetallePost, NgOptimizedImage],
  templateUrl: './explorar.html',
  styleUrl: './explorar.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Explorar implements OnInit, OnDestroy {
  // ========== SERVICIOS ==========
  private themeService = inject(ThemeService);
  private publicacionesService = inject(PublicacionesService);
  private likesService = inject(LikesService);
  private autenticacionService = inject(AutenticacionService);
  private fotosService = inject(FotosService);
  private router = inject(Router);

  // ========== ESTADO (SIGNALS) ==========
  searchTerm = signal('');
  posts = signal<Post[]>([]);
  selectedCategory = signal<string | null>(null);
  isLoading = signal(false);
  cargandoFotos = signal(false);

  // Modal State
  selectedPost = signal<Post | null>(null);
  showPostDetailModal = signal(false);
  showShareModal = signal(false);
  activePostId = signal<number | null>(null);

  currentTheme = signal<Theme>(this.themeService.getCurrentTheme());

  tags = signal<Tag[]>([
    { name: 'Tecnología', icon: 'fa-laptop-code', color: 'teal', posts: 1247, trending: true },
    { name: 'Ciencias', icon: 'fa-flask', color: 'purple', posts: 892, trending: true },
    { name: 'Artes y Cultura', icon: 'fa-palette', color: 'pink', posts: 645, trending: false },
    { name: 'Deportes', icon: 'fa-futbol', color: 'blue', posts: 534, trending: false },
    { name: 'Salud y Bienestar', icon: 'fa-heartbeat', color: 'green', posts: 421, trending: false },
    { name: 'Vida Universitaria', icon: 'fa-graduation-cap', color: 'orange', posts: 389, trending: true },
    { name: 'Opinión', icon: 'fa-comments', color: 'indigo', posts: 312, trending: false },
    { name: 'Entrevistas', icon: 'fa-microphone', color: 'yellow', posts: 278, trending: false }
  ]);

  // ========== COMPUTED ==========
  filteredTags = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.tags().filter(tag => tag.name.toLowerCase().includes(term));
  });

  postsFilttrados = computed(() => {
    const category = this.selectedCategory();
    const allPosts = this.posts();
    if (!category) return allPosts;
    return allPosts.filter(post => post.category.toLowerCase() === category.toLowerCase());
  });

  trendingPosts = computed(() => {
    return [...this.posts()]
      .sort((a, b) => (b.likes || 0) - (a.likes || 0))
      .slice(0, 4);
  });

  private themeSubscription?: Subscription;
  public readonly apiBaseUrl = environment.apiUrl.replace('/api', '');

  // Mapa de colores
  private colorMap: { [key: string]: string } = {
    'teal': '#14b8a6', 'purple': '#a855f7', 'pink': '#ec4899', 'blue': '#3b82f6',
    'green': '#22c55e', 'orange': '#f97316', 'indigo': '#6366f1', 'yellow': '#eab308'
  };

  private darkerColorMap: { [key: string]: string } = {
    'teal': '#0d9488', 'purple': '#9333ea', 'pink': '#db2777', 'blue': '#2563eb',
    'green': '#16a34a', 'orange': '#ea580c', 'indigo': '#4f46e5', 'yellow': '#ca8a04'
  };

  ngOnInit() {
    this.themeSubscription = this.themeService.currentTheme$.subscribe(theme => {
      this.currentTheme.set(theme);
    });
    this.cargarPublicaciones();
  }

  ngOnDestroy() {
    this.themeSubscription?.unsubscribe();
  }

  // ========== CARGA DE DATOS ==========
  private cargarPublicaciones(): void {
    console.log('🚀 [Explorar] DEBUG: Cargando publicaciones...');
    this.isLoading.set(true);
    
    this.publicacionesService.obtenerPublicaciones().subscribe({
      next: (res) => {
        console.log('📦 [Explorar] DEBUG: Respuesta recibida:', res);
        
        if (res.success && res.data) {
          console.log('✨ [Explorar] DEBUG: Publicaciones obtenidas con éxito:', res.data.length);
          const converted = this.convertirPublicacionesAPosts(res.data);
          this.posts.set(converted);
          this.actualizarContadorTags();
          this.cargarFotosPerfilPosts();
        } else {
          console.warn('⚠️ [Explorar] DEBUG: Respuesta sin datos o no exitosa:', res);
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('❌ [Explorar] DEBUG: Error al cargar publicaciones:', error);
        this.isLoading.set(false);
      }
    });
  }

  private cargarFotosPerfilPosts(): void {
    const allPosts = this.posts();
    if (allPosts.length === 0) return;

    this.cargandoFotos.set(true);
    const usuariosIds = [...new Set(allPosts.map(p => p.usuario_id).filter(id => !!id))] as number[];

    if (usuariosIds.length === 0) {
      this.cargandoFotos.set(false);
      return;
    }

    this.fotosService.obtenerFotosBatch(usuariosIds).pipe(
      catchError(() => of(null))
    ).subscribe(response => {
      if (response && response.success && response.data) {
        const fotosMap = new Map(response.data.map(u => [u.id, u.foto_perfil_url]));
        this.posts.update(current => current.map(post => ({
          ...post,
          fotoPerfil: post.usuario_id ? fotosMap.get(post.usuario_id) || null : null
        })));
      }
      this.cargandoFotos.set(false);
    });
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
        image: this.normalizarUrlImagen(p.imagen_url || ''),
        category: p.categoria || 'General',
        categoryColor: p.color_categoria || this.publicacionesService.obtenerColorCategoria(p.categoria || 'General'),
        likes: pubAny.total_likes || 0,
        liked: false,
        shares: pubAny.total_compartidos || 0,
        avatarColor: this.generarColorAvatar(p.usuario_id || 0),
        comments: [],
        usuario_id: p.usuario_id,
        totalComments: pubAny.total_comentarios || 0,
        likeLoading: false,
        fotoPerfil: null
      };
    });
  }

  seleccionarCategoria(tagName: string): void {
    this.selectedCategory.update(current => current === tagName ? null : tagName);
    if (this.selectedCategory()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  isWideCard(index: number): boolean {
    return index % 7 === 0 || index % 10 === 0;
  }

  private actualizarContadorTags(): void {
    const allPosts = this.posts();
    this.tags.update(current => current.map(tag => {
      const count = allPosts.filter(p => p.category.toLowerCase() === tag.name.toLowerCase()).length;
      return { ...tag, posts: count };
    }));
  }

  toggleLike(postId: number): void {
    if (!this.autenticacionService.isAuthenticated()) {
      alert('Debes iniciar sesión para dar like');
      return;
    }

    const post = this.posts().find(p => p.id === postId);
    if (!post || post.likeLoading) return;

    this.posts.update(list => list.map(p => {
      if (p.id === postId) {
        return { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1), likeLoading: true };
      }
      return p;
    }));

    this.likesService.toggleLike(postId).subscribe({
      next: () => {
        this.posts.update(list => list.map(p => p.id === postId ? { ...p, likeLoading: false } : p));
      },
      error: () => {
        this.posts.update(list => list.map(p => {
          if (p.id === postId) {
            return { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1), likeLoading: false };
          }
          return p;
        }));
        alert('Error al actualizar like');
      }
    });
  }

  onImageLoad(event: any, post: Post): void {
    const img = event.target as HTMLImageElement;
    const aspectRatio = img.naturalHeight / img.naturalWidth;
    this.posts.update(list => list.map(p => p.id === post.id ? { ...p, isTooLong: aspectRatio > 1.5 } : p));
  }

  openPostDetail(postId: number) {
    const post = this.posts().find(p => p.id === postId);
    if (post) {
      this.selectedPost.set(post);
      this.showPostDetailModal.set(true);
      document.body.style.overflow = 'hidden';
    }
  }

  closePostDetail() {
    this.showPostDetailModal.set(false);
    this.selectedPost.set(null);
    document.body.style.overflow = 'auto';
  }

  openShareModal(postId: number, event?: Event) {
    event?.stopPropagation();
    this.activePostId.set(postId);
    this.showShareModal.set(true);
  }

  navegarAPerfil(usuario_id?: number, event?: Event): void {
    event?.stopPropagation();
    if (usuario_id) this.router.navigate(['/perfil', usuario_id]);
  }

  getColor(color: string): string { return this.colorMap[color] || '#6b7280'; }
  getGradient(color: string): string {
    return `linear-gradient(to bottom right, ${this.colorMap[color]}, ${this.darkerColorMap[color]})`;
  }

  onCardHover(event: MouseEvent, color: string) {
    (event.currentTarget as HTMLElement).style.borderColor = this.getColor(color);
  }

  onCardLeave(event: MouseEvent) {
    const theme = this.currentTheme().id;
    const isDark = ['midnight', 'neon', 'toxic'].includes(theme);
    (event.currentTarget as HTMLElement).style.borderColor = isDark ? '#1e293b' : '#f3f4f6';
  }

  private obtenerIniciales(nombre: string): string {
    if (!nombre) return 'U';
    const words = nombre.trim().split(' ');
    return words.length >= 2 ? (words[0][0] + words[1][0]).toUpperCase() : nombre.substring(0, 2).toUpperCase();
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
    if (url.startsWith('http://localhost:3000') || url.startsWith('http://3.146.83.30:3000')) {
      return url.replace(/https?:\/\/[^/]+(:[0-9]+)?/, this.apiBaseUrl);
    }
    if (url.startsWith('http')) return url;
    return `${this.apiBaseUrl}${url.startsWith('/') ? url : '/' + url}`;
  }

  private generarColorAvatar(id: number): string { return AVATAR_COLORS[id % AVATAR_COLORS.length]; }

  trackByPostId(index: number, post: Post): number { return post.id; }
  trackByTag(index: number, tag: Tag): string { return tag.name; }

  openCreateModal() {
    console.log('Open create modal');
  }
}