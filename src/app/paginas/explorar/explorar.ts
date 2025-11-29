import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Navbar } from '../../componentes/navbar/navbar';
import { AutenticacionService } from '../../core/servicios/autenticacion/autenticacion';
import { LikesService } from '../../core/servicios/likes/likes';
import { Publicacion, PublicacionesService } from '../../core/servicios/publicaciones/publicaciones';
import { Theme, ThemeService } from '../../core/servicios/temas';
import { FotosService } from '../../core/servicios/fotos/fotos';

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
  usuarioId?: number;
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
  standalone: true,
  imports: [CommonModule, FormsModule, Navbar],
  templateUrl: './explorar.html',
  styleUrl: './explorar.css'
})
export class Explorar implements OnInit, OnDestroy {
  // ========== ESTADO ==========
  searchTerm: string = '';
  currentTheme: Theme;
  posts: Post[] = [];
  selectedCategory: string | null = null;
  isLoading = false;
  cargandoFotos = false;
  
  private themeSubscription?: Subscription;
  public readonly apiBaseUrl = window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : 'http://3.146.83.30:3000';
  
  tags: Tag[] = [
    { name: 'Tecnología', icon: 'fa-laptop-code', color: 'teal', posts: 1247, trending: true },
    { name: 'Ciencias', icon: 'fa-flask', color: 'purple', posts: 892, trending: true },
    { name: 'Artes y Cultura', icon: 'fa-palette', color: 'pink', posts: 645, trending: false },
    { name: 'Deportes', icon: 'fa-futbol', color: 'blue', posts: 534, trending: false },
    { name: 'Salud y Bienestar', icon: 'fa-heartbeat', color: 'green', posts: 421, trending: false },
    { name: 'Vida Universitaria', icon: 'fa-graduation-cap', color: 'orange', posts: 389, trending: true },
    { name: 'Opinión', icon: 'fa-comments', color: 'indigo', posts: 312, trending: false },
    { name: 'Entrevistas', icon: 'fa-microphone', color: 'yellow', posts: 278, trending: false }
  ];
  
  filteredTags: Tag[] = [...this.tags];
  
  // Mapa de colores
  private colorMap: { [key: string]: string } = {
    'teal': '#14b8a6',
    'purple': '#a855f7',
    'pink': '#ec4899',
    'blue': '#3b82f6',
    'green': '#22c55e',
    'orange': '#f97316',
    'indigo': '#6366f1',
    'yellow': '#eab308'
  };

  private darkerColorMap: { [key: string]: string } = {
    'teal': '#0d9488',
    'purple': '#9333ea',
    'pink': '#db2777',
    'blue': '#2563eb',
    'green': '#16a34a',
    'orange': '#ea580c',
    'indigo': '#4f46e5',
    'yellow': '#ca8a04'
  };

  constructor(
    private themeService: ThemeService,
    private publicacionesService: PublicacionesService,
    private likesService: LikesService,
    private autenticacionService: AutenticacionService,
    private fotosService: FotosService,
    private router: Router
  ) {
    this.currentTheme = this.themeService.getCurrentTheme();
  }

  ngOnInit() {
    this.themeSubscription = this.themeService.currentTheme$.subscribe(theme => {
      this.currentTheme = theme;
    });

    // Cargar publicaciones al iniciar
    this.cargarPublicaciones();
  }

  ngOnDestroy() {
    this.themeSubscription?.unsubscribe();
  }

  // ========== CARGA DE DATOS ==========
  private cargarPublicaciones(): void {
    this.isLoading = true;
    this.publicacionesService.obtenerPublicaciones().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.posts = this.convertirPublicacionesAPosts(res.data);
          this.actualizarContadorTags();
          
          // Cargar fotos de perfil de todos los usuarios
          this.cargarFotosPerfilPosts();
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
      }
    });
  }

  /**
   * Carga las fotos de perfil de todos los autores de los posts
   * Usa el método batch para optimizar las peticiones
   */
  private cargarFotosPerfilPosts(): void {
    if (!this.posts || this.posts.length === 0) return;

    this.cargandoFotos = true;

    // Obtener IDs únicos de usuarios
    const usuariosIds = [...new Set(this.posts.map(p => p.usuarioId).filter(id => id !== undefined))] as number[];
    
    if (usuariosIds.length === 0) {
      this.cargandoFotos = false;
      return;
    }

    // Usar el método batch para obtener todas las fotos
    this.fotosService.obtenerFotosBatch(usuariosIds).pipe(
      map(response => {
        if (response.success && response.data) {
          // Crear un mapa para acceso rápido por ID
          const fotosMap = new Map(
            response.data.map(u => [u.id, u.foto_perfil_url])
          );

          // Actualizar posts con las fotos
          this.posts.forEach(post => {
            if (post.usuarioId) {
              post.fotoPerfil = fotosMap.get(post.usuarioId) || null;
            }
          });
        }
      }),
      catchError(error => {
        return of(null);
      })
    ).subscribe({
      next: () => {
        this.cargandoFotos = false;
      },
      error: () => {
        this.cargandoFotos = false;
      }
    });
  }

  /**
   * Método alternativo: cargar fotos individualmente (fallback)
   * Usar solo si el método batch falla
   */
  private cargarFotosIndividualmente(): void {
    if (!this.posts || this.posts.length === 0) return;

    this.cargandoFotos = true;

    // Obtener IDs únicos
    const usuariosIds = [...new Set(this.posts.map(p => p.usuarioId).filter(id => id !== undefined))] as number[];

    // Crear peticiones individuales
    const peticiones = usuariosIds.map(usuarioId =>
      this.fotosService.obtenerFotoPerfil(usuarioId).pipe(
        map(response => ({
          id: usuarioId,
          foto: response.success ? response.data.foto_perfil_url : null
        })),
        catchError(error => {
          return of({ id: usuarioId, foto: null });
        })
      )
    );

    // Ejecutar todas en paralelo
    forkJoin(peticiones).subscribe({
      next: (resultados) => {
        // Crear mapa de fotos
        const fotosMap = new Map(resultados.map(r => [r.id, r.foto]));

        // Asignar fotos a posts
        this.posts.forEach(post => {
          if (post.usuarioId) {
            post.fotoPerfil = fotosMap.get(post.usuarioId) || null;
          }
        });

        this.cargandoFotos = false;
      },
      error: (error) => {
        this.cargandoFotos = false;
      }
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
        image: this.normalizarUrlImagen(p.imagen_s3 || p.imagen_url || ''),
        category: p.categoria || 'General',
        categoryColor: p.color_categoria || this.publicacionesService.obtenerColorCategoria(p.categoria || 'General'),
        likes: pubAny.total_likes || 0,
        liked: false,
        shares: pubAny.total_compartidos || 0,
        avatarColor: this.generarColorAvatar(p.usuario_id),
        comments: [],
        usuarioId: p.usuario_id,
        totalComments: pubAny.total_comentarios || 0,
        likeLoading: false,
        isTooLong: false,
        aspectRatio: 0,
        fotoPerfil: null
      };
    });
  }

  // ========== FILTRADO Y BÚSQUEDA ==========
  filterTags() {
    this.filteredTags = this.tags.filter(tag =>
      tag.name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  seleccionarCategoria(tagName: string): void {
    this.selectedCategory = this.selectedCategory === tagName ? null : tagName;
  }

  get postsFilttrados(): Post[] {
    if (!this.selectedCategory) return this.posts;
    
    return this.posts.filter(post =>
      post.category.toLowerCase() === this.selectedCategory?.toLowerCase()
    );
  }

  private actualizarContadorTags(): void {
    this.tags = this.tags.map(tag => {
      const cantidad = this.posts.filter(p =>
        p.category.toLowerCase() === tag.name.toLowerCase()
      ).length;
      return { ...tag, posts: cantidad };
    });
    this.filteredTags = [...this.tags];
  }

  // ========== LIKES ==========
  toggleLike(postId: number): void {
    if (!this.autenticacionService.isAuthenticated()) {
      alert('Debes iniciar sesión para dar like');
      return;
    }

    const post = this.posts.find(p => p.id === postId);
    if (!post || post.likeLoading) return;

    const likeAnterior = post.liked;
    const likesAnterior = post.likes;

    post.liked = !post.liked;
    post.likes += post.liked ? 1 : -1;
    post.likeLoading = true;

    this.likesService.toggleLike(postId).subscribe({
      next: (response) => {
        post.likeLoading = false;
      },
      error: (error) => {
        post.liked = likeAnterior;
        post.likes = likesAnterior;
        post.likeLoading = false;
        alert('Error al actualizar like');
      }
    });
  }

  // ========== DETECCIÓN DE IMÁGENES LARGAS ==========
  isImageTooLong(post: Post): boolean {
    const maxAspectRatio = 1.5;
    if (!post.image) return false;
    return post['isTooLong'] || false;
  }

  onImageLoad(event: any, post: Post): void {
    const img = event.target as HTMLImageElement;
    const aspectRatio = img.naturalHeight / img.naturalWidth;
    
    post['aspectRatio'] = aspectRatio;
    post['isTooLong'] = aspectRatio > 1.5;
  }

  // ========== UTILIDADES ==========
  filterTagsBySearch(searchTerm: string): Tag[] {
    return this.tags.filter(tag =>
      tag.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  openCreateModal() {
    return;
  }

  openPostDetail(postId: number) {
    return;
  }

  openShareModal(postId: number, event?: Event) {
    return;
  }

  getColor(color: string): string {
    return this.colorMap[color] || '#6b7280';
  }

  getDarkerColor(color: string): string {
    return this.darkerColorMap[color] || '#4b5563';
  }

  getGradient(color: string): string {
    const baseColor = this.colorMap[color];
    const darkerColor = this.darkerColorMap[color];
    return `linear-gradient(to bottom right, ${baseColor}, ${darkerColor})`;
  }

  onCardHover(event: MouseEvent, color: string) {
    const card = event.currentTarget as HTMLElement;
    card.style.borderColor = this.getColor(color);
  }

  onCardLeave(event: MouseEvent) {
    const card = event.currentTarget as HTMLElement;
    const borderColor = this.currentTheme.id === 'midnight' || 
                        this.currentTheme.id === 'neon' || 
                        this.currentTheme.id === 'toxic' 
                        ? '#1e293b' 
                        : '#f3f4f6';
    card.style.borderColor = borderColor;
  }

  private obtenerIniciales(nombre: string): string {
    if (!nombre) return 'U';
    const palabras = nombre.trim().split(' ');
    return palabras.length >= 2
      ? (palabras[0][0] + palabras[1][0]).toUpperCase()
      : nombre.substring(0, 2).toUpperCase();
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
    if (url.startsWith('http')) return url;
    return `${this.apiBaseUrl}${url.startsWith('/') ? url : '/' + url}`;
  }

  private generarColorAvatar(id: number): string {
    return AVATAR_COLORS[id % AVATAR_COLORS.length];
  }

  trackByPostId(index: number, post: Post): number {
    return post.id;
  }

  trackByTag(index: number, tag: Tag): string {
    return tag.name;
  }

  hexToRgb(hex: string): string {
    if (!hex) return '107, 114, 128';
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result 
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : '107, 114, 128';
  }
}