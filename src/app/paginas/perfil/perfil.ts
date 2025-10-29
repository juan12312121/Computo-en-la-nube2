import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { DetallePost } from '../../componentes/detalle-post/detalle-post';
import { ModalCambiarBanner } from '../../componentes/modal-cambiar-banner/modal-cambiar-banner';
import { FormularioEditarPerfil, ModalEditarPerfil } from '../../componentes/modal-editar-perfil/modal-editar-perfil';
import { NavbarComponent } from '../../componentes/navbar/navbar';
import { Usuario } from '../../core/servicios/autenticacion/autenticacion';
import { Theme, ThemeService } from '../../core/servicios/temas';
import { UsuarioService } from '../../core/servicios/usuarios/usuarios';
import { PublicacionesService, Publicacion } from '../../core/servicios/publicaciones/publicaciones';

interface UsuarioPerfil extends Usuario {
  // La interfaz Usuario ya tiene todos los campos necesarios
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

interface Document {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  size: string;
  date: string;
}

interface Section {
  id: number;
  name: string;
  icon: string;
  color: string;
  posts: number;
}

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [
    CommonModule, 
    NavbarComponent, 
    DetallePost, 
    ModalEditarPerfil,
    ModalCambiarBanner
  ],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css'
})
export class Perfil implements OnInit, OnDestroy {
  // URL base de la API
  public apiBaseUrl: string;

  // Usuario real desde la API
  usuario: UsuarioPerfil | null = null;
  cargandoPerfil = true;
  errorCarga = false;
  
  // Publicaciones reales
  publicacionesReales: Publicacion[] = [];
  cargandoPublicaciones = true;
  
  // Estados del perfil
  isOwnProfile = true;
  activeTab: 'todo' | 'fotos' | 'documentos' | 'secciones' = 'todo';
  
  // Modal de sección
  showSectionModal = false;
  selectedSection: Section | null = null;
  
  // Modal de edición de perfil
  showEditModal = false;
  guardandoPerfil = false;
  errorGuardado = false;
  mensajeError = '';
  
  // Modal de banner
  showBannerModal = false;
  guardandoBanner = false;
  errorBanner = '';
  
  // Tema
  currentTheme: Theme;
  private themeSubscription?: Subscription;

  // Detalle de post
  selectedPost: Post | null = null;
  showPostDetail = false;

  // Datos convertidos de la API
  posts: Post[] = [];
  photos: Photo[] = [];

  // Datos mock que permanecen
  documents: Document[] = [
    {
      id: 1,
      name: 'Apuntes de Algoritmos.pdf',
      description: 'Notas completas del curso de Estructuras de Datos y Algoritmos',
      icon: 'fa-file-pdf',
      color: 'text-red-500',
      size: '2.4 MB',
      date: 'Hace 3 días'
    },
    {
      id: 2,
      name: 'Proyecto Final - Desarrollo Web.zip',
      description: 'Código fuente completo del proyecto de fin de semestre',
      icon: 'fa-file-archive',
      color: 'text-yellow-500',
      size: '15.8 MB',
      date: 'Hace 1 semana'
    },
    {
      id: 3,
      name: 'Presentación Machine Learning.pptx',
      description: 'Slides de la presentación del modelo de clasificación',
      icon: 'fa-file-powerpoint',
      color: 'text-orange-500',
      size: '8.2 MB',
      date: 'Hace 2 semanas'
    },
    {
      id: 4,
      name: 'Resumen Bases de Datos.docx',
      description: 'Resumen de SQL, NoSQL y optimización de queries',
      icon: 'fa-file-word',
      color: 'text-blue-500',
      size: '1.1 MB',
      date: 'Hace 1 mes'
    },
    {
      id: 5,
      name: 'Guía de React Hooks.pdf',
      description: 'Tutorial completo sobre useState, useEffect y hooks personalizados',
      icon: 'fa-file-pdf',
      color: 'text-red-500',
      size: '3.7 MB',
      date: 'Hace 1 mes'
    },
    {
      id: 6,
      name: 'Dataset - Análisis de Datos.csv',
      description: 'Dataset para el proyecto de análisis estadístico',
      icon: 'fa-file-csv',
      color: 'text-green-500',
      size: '5.3 MB',
      date: 'Hace 2 meses'
    }
  ];

  sections: Section[] = [
    { id: 1, name: 'Proyectos de IA', icon: 'fa-brain', color: 'from-purple-500 to-purple-700', posts: 12 },
    { id: 2, name: 'Desarrollo Web', icon: 'fa-code', color: 'from-blue-500 to-blue-700', posts: 28 },
    { id: 3, name: 'Mobile Apps', icon: 'fa-mobile-alt', color: 'from-teal-500 to-teal-700', posts: 8 },
    { id: 4, name: 'Bases de Datos', icon: 'fa-database', color: 'from-green-500 to-green-700', posts: 15 },
    { id: 5, name: 'DevOps', icon: 'fa-server', color: 'from-orange-500 to-orange-700', posts: 6 },
    { id: 6, name: 'Diseño UI/UX', icon: 'fa-paint-brush', color: 'from-pink-500 to-pink-700', posts: 10 }
  ];

  constructor(
    private themeService: ThemeService,
    private usuarioService: UsuarioService,
    private publicacionesService: PublicacionesService
  ) {
    this.currentTheme = this.themeService.getCurrentTheme();
    
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      this.apiBaseUrl = 'http://localhost:3000';
    } else {
      this.apiBaseUrl = 'http://13.59.190.199:3000';
    }
  }

  ngOnInit() {
    this.themeSubscription = this.themeService.currentTheme$.subscribe(theme => {
      this.currentTheme = theme;
    });
    this.cargarPerfil();
  }

  ngOnDestroy() {
    this.themeSubscription?.unsubscribe();
  }

  // ==================== CARGA DE PERFIL ====================
  
  cargarPerfil(): void {
    this.cargandoPerfil = true;
    this.cargandoPublicaciones = true;
    this.errorCarga = false;

    // Primero cargar el perfil
    this.usuarioService.obtenerMiPerfil().subscribe({
      next: (responsePerfil) => {
        if (responsePerfil.success && responsePerfil.data) {
          this.usuario = responsePerfil.data;
          this.cargandoPerfil = false;
          
          // Luego cargar las publicaciones
          this.cargarPublicaciones();
        } else {
          this.errorCarga = true;
          this.cargandoPerfil = false;
          this.cargandoPublicaciones = false;
        }
      },
      error: (error) => {
        console.error('Error al cargar perfil:', error);
        this.errorCarga = true;
        this.cargandoPerfil = false;
        this.cargandoPublicaciones = false;
      }
    });
  }

  private cargarPublicaciones(): void {
    this.publicacionesService.obtenerMisPublicaciones().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.publicacionesReales = response.data;
          this.actualizarPostsDesdeAPI();
        } else {
          // No hay publicaciones, pero no es un error
          this.publicacionesReales = [];
          this.posts = [];
          this.photos = [];
        }
        this.cargandoPublicaciones = false;
      },
      error: (error) => {
        console.error('Error al cargar publicaciones:', error);
        // No mostrar error de carga general, solo dejar vacío
        this.publicacionesReales = [];
        this.posts = [];
        this.photos = [];
        this.cargandoPublicaciones = false;
      }
    });
  }

  reintentarCarga(): void {
    this.cargarPerfil();
  }

  // Convertir publicaciones API a formato Post
  private actualizarPostsDesdeAPI(): void {
    this.posts = this.publicacionesReales.map(pub => this.convertirPublicacionAPost(pub));
    
    // Actualizar también las fotos desde las publicaciones con imagen
    this.photos = this.publicacionesReales
      .filter(pub => pub.imagen_url || pub.imagen_s3)
      .map((pub, index) => ({
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
      likes: 0, // Esto deberías obtenerlo de tu API si tienes likes
      liked: false,
      shares: 0,
      avatarColor: this.generarColorAvatar(pub.usuario_id),
      comments: []
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

  // ==================== UTILIDADES ====================
  
  getInitials(): string {
    if (!this.usuario?.nombre_completo) return '??';
    
    const names = this.usuario.nombre_completo.trim().split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return names[0].substring(0, 2).toUpperCase();
  }

  getProfileImage(): string | null {
    if (!this.usuario?.foto_perfil_url) return null;
    
    if (this.usuario.foto_perfil_url.startsWith('http')) {
      return this.usuario.foto_perfil_url;
    }
    
    return `${this.apiBaseUrl}${this.usuario.foto_perfil_url}`;
  }

  getCoverImage(): string | null {
    if (!this.usuario?.foto_portada_url) return null;
    
    if (this.usuario.foto_portada_url.startsWith('http')) {
      return this.usuario.foto_portada_url;
    }
    
    return `${this.apiBaseUrl}${this.usuario.foto_portada_url}`;
  }

  // ==================== EDICIÓN DE PERFIL ====================
  
  toggleProfileMode(): void {
    if (this.isOwnProfile) {
      this.abrirModalEdicion();
    }
  }

  abrirModalEdicion(): void {
    this.showEditModal = true;
    this.errorGuardado = false;
    document.body.style.overflow = 'hidden';
  }

  cerrarModalEdicion(): void {
    this.showEditModal = false;
    this.guardandoPerfil = false;
    this.errorGuardado = false;
    this.mensajeError = '';
    document.body.style.overflow = 'auto';
  }

  guardarPerfil(data: {formulario: FormularioEditarPerfil, archivo: File | null}): void {
    if (!this.usuario) return;
    
    this.guardandoPerfil = true;
    this.errorGuardado = false;
    
    const formData = new FormData();
    let hayCambios = false;
    
    if (data.formulario.nombre_completo !== this.usuario.nombre_completo) {
      formData.append('nombre_completo', data.formulario.nombre_completo);
      hayCambios = true;
    }
    if (data.formulario.biografia !== (this.usuario.biografia || '')) {
      formData.append('biografia', data.formulario.biografia);
      hayCambios = true;
    }
    if (data.formulario.ubicacion !== (this.usuario.ubicacion || '')) {
      formData.append('ubicacion', data.formulario.ubicacion);
      hayCambios = true;
    }
    if (data.formulario.carrera !== (this.usuario.carrera || '')) {
      formData.append('carrera', data.formulario.carrera);
      hayCambios = true;
    }
    
    if (data.archivo) {
      formData.append('foto_perfil', data.archivo);
      hayCambios = true;
    }
    
    if (!hayCambios) {
      this.cerrarModalEdicion();
      return;
    }
    
    this.usuarioService.actualizarPerfil(formData).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.usuario = { ...this.usuario, ...response.data };
          this.guardandoPerfil = false;
          this.cerrarModalEdicion();
        }
      },
      error: (error) => {
        console.error('Error al actualizar perfil:', error);
        this.errorGuardado = true;
        this.mensajeError = error.error?.mensaje || 'Error al actualizar el perfil';
        this.guardandoPerfil = false;
      }
    });
  }

  // ==================== BANNER ====================
  
  abrirModalCambiarBanner(): void {
    this.showBannerModal = true;
    this.errorBanner = '';
    document.body.style.overflow = 'hidden';
  }

  cerrarModalBanner(): void {
    this.showBannerModal = false;
    this.guardandoBanner = false;
    this.errorBanner = '';
    document.body.style.overflow = 'auto';
  }

  guardarBanner(archivo: File): void {
    this.guardandoBanner = true;
    this.errorBanner = '';
    
    const formData = new FormData();
    formData.append('foto_portada', archivo);
    
    this.usuarioService.actualizarPerfil(formData).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.usuario = { ...this.usuario, ...response.data };
          this.guardandoBanner = false;
          this.cerrarModalBanner();
        }
      },
      error: (error) => {
        console.error('Error al actualizar banner:', error);
        this.errorBanner = error.error?.mensaje || 'Error al actualizar la portada';
        this.guardandoBanner = false;
      }
    });
  }

  eliminarBanner(): void {
    this.guardandoBanner = true;
    this.errorBanner = '';
    
    const formData = new FormData();
    formData.append('foto_portada', '');
    
    this.usuarioService.actualizarPerfil(formData).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.usuario = { ...this.usuario, ...response.data };
          this.guardandoBanner = false;
          this.cerrarModalBanner();
        }
      },
      error: (error) => {
        console.error('Error al eliminar banner:', error);
        this.errorBanner = error.error?.mensaje || 'Error al eliminar la portada';
        this.guardandoBanner = false;
      }
    });
  }

  // ==================== NAVEGACIÓN ====================
  
  switchTab(tab: 'todo' | 'fotos' | 'documentos' | 'secciones'): void {
    this.activeTab = tab;
  }

  openSectionModal(sectionId: number): void {
    this.selectedSection = this.sections.find(s => s.id === sectionId) || null;
    this.showSectionModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeSectionModal(): void {
    this.showSectionModal = false;
    this.selectedSection = null;
    document.body.style.overflow = 'auto';
  }

  onModalBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.closeSectionModal();
    }
  }

  // ==================== POSTS ====================
  
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
    const post = this.posts.find(p => p.id === postId);
    if (post) {
      post.liked = !post.liked;
      post.likes += post.liked ? 1 : -1;
    }
  }

  onCommentAdded(data: {postId: number, comment: string}): void {
    const post = this.posts.find(p => p.id === data.postId);
    if (post) {
      const newComment: Comment = {
        id: post.comments.length + 1,
        author: this.usuario?.nombre_completo || 'Usuario',
        avatar: this.getInitials(),
        text: data.comment,
        time: 'Ahora',
        avatarColor: 'from-teal-400 to-teal-600'
      };
      post.comments.push(newComment);
    }
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

  openCreateModal(): void {
    console.log('Abrir modal de crear post');
  }
}