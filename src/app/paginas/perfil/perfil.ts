import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ModalCambiarBanner } from '../../componentes/modal-cambiar-banner/modal-cambiar-banner';
import { FormularioEditarPerfil, ModalEditarPerfil } from '../../componentes/modal-editar-perfil/modal-editar-perfil';
import { NavbarComponent } from '../../componentes/navbar/navbar';
import { PublicacionesPerfil } from '../../componentes/publicaciones-perfil/publicaciones-perfil';
import { FotosPerfil } from '../../componentes/fotos-perfil/fotos-perfil';
import { Usuario } from '../../core/servicios/autenticacion/autenticacion';
import { Theme, ThemeService } from '../../core/servicios/temas';
import { UsuarioService } from '../../core/servicios/usuarios/usuarios';
import { PublicacionesService, Publicacion } from '../../core/servicios/publicaciones/publicaciones';
import { FotosService, FotosData } from '../../core/servicios/fotos/fotos';

interface UsuarioPerfil extends Usuario {
  // La interfaz Usuario ya tiene todos los campos necesarios
}

interface Photo {
  id: number | string;
  url: string;
  caption: string;
  postId?: number;
  tipo: 'perfil' | 'portada' | 'publicacion';
  fecha?: string | null;
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
    PublicacionesPerfil,
    ModalEditarPerfil,
    ModalCambiarBanner,
    FotosPerfil
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

  // Fotos completas del usuario (perfil, portada y publicaciones)
  photos: Photo[] = [];
  fotosData: FotosData | null = null;
  cargandoFotos = false;

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
    private publicacionesService: PublicacionesService,
    private fotosService: FotosService
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
          
          // Luego cargar las publicaciones y fotos
          this.cargarPublicaciones();
          this.cargarTodasLasFotos();
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
        } else {
          this.publicacionesReales = [];
        }
        this.cargandoPublicaciones = false;
      },
      error: (error) => {
        console.error('Error al cargar publicaciones:', error);
        this.publicacionesReales = [];
        this.cargandoPublicaciones = false;
      }
    });
  }

  // Nueva función para cargar todas las fotos usando el servicio
  private cargarTodasLasFotos(): void {
    this.cargandoFotos = true;
    
    console.log('DEBUG: Iniciando carga de fotos...'); // Log de inicio

    this.fotosService.getMisFotos().subscribe({
      next: (data: FotosData) => {
        console.log('DEBUG: Datos recibidos del servicio de fotos:', data); // Log de los datos crudos
        this.fotosData = data;
        this.procesarFotos(data);
        this.cargandoFotos = false;
        console.log('DEBUG: Fotos cargadas y procesadas correctamente.'); // Log de éxito
      },
      error: (error) => {
        console.error('Error al cargar fotos:', error);
        console.log('DEBUG: Error al cargar fotos. Reiniciando photos a un array vacío.'); // Log de error
        this.photos = [];
        this.cargandoFotos = false;
      }
    });
  }

  // Procesar las fotos recibidas del servicio
  private procesarFotos(data: FotosData): void {
    console.log('DEBUG: Iniciando procesamiento de fotos con datos:', data); // Log de entrada a la función
    const fotosArray: Photo[] = [];

    // Agregar foto de perfil si existe
    if (data.fotos.perfil && data.fotos.perfil.url) {
      const perfilPhoto: Photo = {
        id: 'perfil',
        url: this.normalizarUrl(data.fotos.perfil.url),
        caption: 'Foto de perfil',
        tipo: 'perfil'
      };
      fotosArray.push(perfilPhoto);
      console.log('DEBUG: Foto de perfil agregada:', perfilPhoto); // Log de foto de perfil
    } else {
      console.log('DEBUG: No se encontró foto de perfil o URL.');
    }

    // Agregar foto de portada si existe
    if (data.fotos.portada && data.fotos.portada.url) {
      const portadaPhoto: Photo = {
        id: 'portada',
        url: this.normalizarUrl(data.fotos.portada.url),
        caption: 'Foto de portada',
        tipo: 'portada'
      };
      fotosArray.push(portadaPhoto);
      console.log('DEBUG: Foto de portada agregada:', portadaPhoto); // Log de foto de portada
    } else {
      console.log('DEBUG: No se encontró foto de portada o URL.');
    }

    // Agregar fotos de publicaciones
    if (data.fotos.publicaciones && data.fotos.publicaciones.length > 0) {
      console.log(`DEBUG: Procesando ${data.fotos.publicaciones.length} publicaciones.`);
      data.fotos.publicaciones.forEach(pub => {
        if (pub.url) {
          const publicacionPhoto: Photo = {
            id: pub.id,
            url: this.normalizarUrl(pub.url),
            caption: pub.descripcion ? 
              (pub.descripcion.substring(0, 50) + (pub.descripcion.length > 50 ? '...' : '')) : 
              'Publicación',
            postId: pub.id,
            tipo: 'publicacion',
            fecha: pub.fecha
          };
          fotosArray.push(publicacionPhoto);
          console.log('DEBUG: Foto de publicación agregada:', publicacionPhoto); // Log de cada publicación
        } else {
          console.log(`DEBUG: Publicación con ID ${pub.id} no tiene URL, omitiendo.`);
        }
      });
    } else {
      console.log('DEBUG: No se encontraron publicaciones con fotos.');
    }

    this.photos = fotosArray;
    console.log('DEBUG: Array final de fotos procesadas (this.photos):', this.photos); // Log del array final
  }

  // Normalizar URL para asegurar que sea completa
  private normalizarUrl(url: string): string {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    const normalizedUrl = `${this.apiBaseUrl}${url.startsWith('/') ? url : '/' + url}`;
    console.log(`DEBUG: Normalizando URL: ${url} -> ${normalizedUrl}`); // Log de normalización de URL
    return normalizedUrl;
  }

  reintentarCarga(): void {
    console.log('DEBUG: Reintentando carga de perfil...'); // Log de reintento
    this.cargarPerfil();
  }

  // ==================== UTILIDADES ====================
  
  getInitials(): string {
    if (!this.usuario) return '??';
    
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
          // Recargar las fotos después de actualizar el perfil
          this.cargarTodasLasFotos();
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
          // Recargar las fotos después de actualizar el banner
          this.cargarTodasLasFotos();
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
          // Recargar las fotos después de eliminar el banner
          this.cargarTodasLasFotos();
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

  // ==================== EVENTOS DE PUBLICACIONES ====================
  
  onLikeToggled(postId: number): void {
    console.log('Like toggled en post:', postId);
    // Aquí puedes hacer la llamada a la API para dar like
  }

  onCommentAdded(data: {postId: number, comment: string}): void {
    console.log('Comentario agregado:', data);
    // Aquí puedes hacer la llamada a la API para agregar el comentario
  }

  openCreateModal(): void {
    console.log('Abrir modal de crear post');
  }
}