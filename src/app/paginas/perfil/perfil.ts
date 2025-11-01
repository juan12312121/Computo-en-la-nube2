import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { Document, DocumentosLista } from '../../componentes/documentos-lista/documentos-lista';
import { FotosPerfil } from '../../componentes/fotos-perfil/fotos-perfil';
import { ModalCambiarBanner } from '../../componentes/modal-cambiar-banner/modal-cambiar-banner';
import { FormularioEditarPerfil, ModalEditarPerfil } from '../../componentes/modal-editar-perfil/modal-editar-perfil';
import { ModalSeguidores, TipoModal } from '../../componentes/modal-seguidores/modal-seguidores';
import { NavbarComponent } from '../../componentes/navbar/navbar';
import { ProfileErrorComponent } from '../../componentes/profile-error/profile-error';
import { ProfileHeaderComponent, UsuarioPerfil } from '../../componentes/profile-header/profile-header';
import { ProfileLoadingComponent } from '../../componentes/profile-loading/profile-loading';
import { ProfileTabsComponent, TabType } from '../../componentes/profile-tabs/profile-tabs';
import { PublicacionesPerfil } from '../../componentes/publicaciones-perfil/publicaciones-perfil';
import { SeccionesGrid, Section } from '../../componentes/secciones-grid/secciones-grid';
import { AutenticacionService, Usuario } from '../../core/servicios/autenticacion/autenticacion';
import { FotosService } from '../../core/servicios/fotos/fotos';
import { Publicacion, PublicacionesService } from '../../core/servicios/publicaciones/publicaciones';
import { SeguidorService } from '../../core/servicios/seguidores/seguidores';
import { Theme, ThemeService } from '../../core/servicios/temas';
import { UsuarioService } from '../../core/servicios/usuarios/usuarios';

interface Photo {
  id: number | string;
  url: string;
  caption: string;
  postId?: number;
  tipo: 'perfil' | 'portada' | 'publicacion';
  fecha?: string | null;
}

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    ProfileLoadingComponent,
    ProfileErrorComponent,
    ProfileHeaderComponent,
    ProfileTabsComponent,
    PublicacionesPerfil,
    ModalEditarPerfil,
    ModalCambiarBanner,
    FotosPerfil,
    DocumentosLista,
    SeccionesGrid,
    ModalSeguidores,
  ],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css'
})
export class Perfil implements OnInit, OnDestroy {
  public apiBaseUrl: string;

  usuario: UsuarioPerfil | null = null;
  usuarioActual: Usuario | null = null;
  cargandoPerfil = true;
  errorCarga = false;
  
  publicacionesReales: Publicacion[] = [];
  cargandoPublicaciones = true;
  
  isOwnProfile = true;
  activeTab: TabType = 'todo';
  
  showEditModal = false;
  guardandoPerfil = false;
  errorGuardado = false;
  mensajeError = '';
  
  showBannerModal = false;
  guardandoBanner = false;
  errorBanner = '';
  
  showSeguidoresModal = false;
  tipoModalSeguidores: TipoModal = 'seguidores';
  
  currentTheme: Theme;
  private themeSubscription?: Subscription;
  private routeSubscription?: Subscription;

  photos: Photo[] = [];
  cargandoFotos = false;

  estaSiguiendo = false;
  cargandoSeguir = false;

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
    private fotosService: FotosService,
    private authService: AutenticacionService,
    private seguidorService: SeguidorService,
    private route: ActivatedRoute
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

    this.usuarioActual = this.authService.currentUserValue;

    this.routeSubscription = this.route.params.subscribe(params => {
      const userId = params['id'];
      if (userId) {
        this.cargarPerfilUsuario(Number(userId));
      } else {
        this.cargarMiPerfil();
      }
    });
  }

  ngOnDestroy() {
    this.themeSubscription?.unsubscribe();
    this.routeSubscription?.unsubscribe();
  }

  // ==================== CARGA DE PERFIL ====================
  
  cargarMiPerfil(): void {
    this.cargandoPerfil = true;
    this.cargandoPublicaciones = true;
    this.errorCarga = false;
    this.isOwnProfile = true;

    this.usuarioService.obtenerMiPerfil().subscribe({
      next: (responsePerfil) => {
        if (responsePerfil.success && responsePerfil.data) {
          this.usuario = responsePerfil.data;
          this.cargandoPerfil = false;
          this.cargarPublicaciones();
          this.cargarMisFotos();
        } else {
          this.errorCarga = true;
          this.cargandoPerfil = false;
          this.cargandoPublicaciones = false;
        }
      },
      error: (error: any) => {
        console.error('Error al cargar perfil:', error);
        this.errorCarga = true;
        this.cargandoPerfil = false;
        this.cargandoPublicaciones = false;
      }
    });
  }

  cargarPerfilUsuario(userId: number): void {
    this.cargandoPerfil = true;
    this.cargandoPublicaciones = true;
    this.errorCarga = false;
    this.isOwnProfile = this.usuarioActual?.id === userId;

    this.usuarioService.obtenerPerfil(userId).subscribe({
      next: (responsePerfil) => {
        if (responsePerfil.success && responsePerfil.data) {
          this.usuario = responsePerfil.data;
          this.cargandoPerfil = false;
          this.cargarPublicacionesUsuario(userId);
          
          if (this.isOwnProfile) {
            this.cargarMisFotos();
          } else {
            this.cargarFotosUsuario(userId);
          }
          
          if (!this.isOwnProfile && this.usuarioActual) {
            this.verificarSeguimiento();
          }
        } else {
          this.errorCarga = true;
          this.cargandoPerfil = false;
          this.cargandoPublicaciones = false;
        }
      },
      error: (error: any) => {
        console.error('Error al cargar perfil del usuario:', error);
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
      error: (error: any) => {
        console.error('Error al cargar publicaciones:', error);
        this.publicacionesReales = [];
        this.cargandoPublicaciones = false;
      }
    });
  }

  private cargarPublicacionesUsuario(userId: number): void {
    this.publicacionesService.obtenerPublicacionesUsuario(userId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.publicacionesReales = response.data;
        } else {
          this.publicacionesReales = [];
        }
        this.cargandoPublicaciones = false;
      },
      error: (error: any) => {
        console.error('Error al cargar publicaciones del usuario:', error);
        this.publicacionesReales = [];
        this.cargandoPublicaciones = false;
      }
    });
  }

  private cargarMisFotos(): void {
    this.cargandoFotos = true;
    
    this.fotosService.obtenerMisFotos().subscribe({
      next: (fotos: Photo[]) => {
        this.photos = fotos;
        this.cargandoFotos = false;
      },
      error: (error: any) => {
        console.error('Error al cargar fotos:', error);
        this.photos = [];
        this.cargandoFotos = false;
      }
    });
  }

  private cargarFotosUsuario(userId: number): void {
    this.cargandoFotos = true;
    
    this.fotosService.obtenerFotosUsuario(userId).subscribe({
      next: (fotos: Photo[]) => {
        this.photos = fotos;
        this.cargandoFotos = false;
      },
      error: (error: any) => {
        console.error('Error al cargar fotos del usuario:', error);
        this.photos = [];
        this.cargandoFotos = false;
      }
    });
  }

  reintentarCarga(): void {
    const userId = this.route.snapshot.params['id'];
    if (userId) {
      this.cargarPerfilUsuario(Number(userId));
    } else {
      this.cargarMiPerfil();
    }
  }

  // ==================== SEGUIMIENTO ====================
  
  private verificarSeguimiento(): void {
    if (!this.usuarioActual || !this.usuario) {
      return;
    }

    this.seguidorService.verificar(this.usuarioActual.id, this.usuario.id).subscribe({
      next: (response) => {
        this.estaSiguiendo = response.sigue || false;
      },
      error: (error: any) => {
        console.error('Error al verificar seguimiento:', error);
      }
    });
  }

  toggleSeguir(): void {
    if (!this.usuarioActual) {
      alert('Debes iniciar sesión para seguir usuarios');
      return;
    }

    if (!this.usuario || this.isOwnProfile || this.cargandoSeguir) {
      return;
    }

    this.cargandoSeguir = true;

    this.seguidorService.toggle(this.usuarioActual.id, this.usuario.id).subscribe({
      next: (response) => {
        if (response.success) {
          const nuevoEstado = response.following ?? false;
          this.estaSiguiendo = nuevoEstado;
          
          if (this.usuario) {
            const seguidoresAntes = this.usuario.total_seguidores || 0;
            if (nuevoEstado) {
              this.usuario.total_seguidores = seguidoresAntes + 1;
            } else {
              this.usuario.total_seguidores = Math.max(0, seguidoresAntes - 1);
            }
          }
        } else {
          alert('Error al procesar la solicitud');
        }
        
        this.cargandoSeguir = false;
      },
      error: (error: any) => {
        console.error('Error al cambiar seguimiento:', error);
        
        let mensajeError = 'Error al procesar la solicitud de seguimiento';
        if (error.status === 401) {
          mensajeError = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente';
        } else if (error.status === 404) {
          mensajeError = 'Usuario no encontrado';
        } else if (error.error?.mensaje) {
          mensajeError = error.error.mensaje;
        }
        
        alert(mensajeError);
        this.cargandoSeguir = false;
      }
    });
  }

  // ==================== MODAL SEGUIDORES ====================
  
  abrirSeguidores(): void {
    this.tipoModalSeguidores = 'seguidores';
    this.showSeguidoresModal = true;
    document.body.style.overflow = 'hidden';
  }

  abrirSiguiendo(): void {
    this.tipoModalSeguidores = 'seguidos';
    this.showSeguidoresModal = true;
    document.body.style.overflow = 'hidden';
  }

  cerrarModalSeguidores(): void {
    this.showSeguidoresModal = false;
    document.body.style.overflow = 'auto';
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
    } else {
      this.toggleSeguir();
    }
  }

  getButtonText(): string {
    if (this.isOwnProfile) {
      return 'Editar perfil';
    }
    return this.cargandoSeguir ? 'Cargando...' : (this.estaSiguiendo ? 'Siguiendo' : 'Seguir');
  }

  getButtonIcon(): string {
    if (this.isOwnProfile) {
      return 'fas fa-edit';
    }
    return this.estaSiguiendo ? 'fas fa-user-check' : 'fas fa-user-plus';
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
          this.cargarMisFotos();
        }
      },
      error: (error: any) => {
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
          this.cargarMisFotos();
        }
      },
      error: (error: any) => {
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
          this.cargarMisFotos();
        }
      },
      error: (error: any) => {
        console.error('Error al eliminar banner:', error);
        this.errorBanner = error.error?.mensaje || 'Error al eliminar la portada';
        this.guardandoBanner = false;
      }
    });
  }

  // ==================== NAVEGACIÓN ====================
  
  switchTab(tab: TabType): void {
    this.activeTab = tab;
  }

  onSectionSelected(sectionId: number): void {
    console.log('Sección seleccionada:', sectionId);
  }

  onDocumentDownload(docId: number): void {
    console.log('Descargar documento:', docId);
  }

  // ==================== EVENTOS DE PUBLICACIONES ====================
  
  onLikeToggled(postId: number): void {
    console.log('Like toggled en post:', postId);
  }

  onCommentAdded(data: {postId: number, comment: string}): void {
    console.log('Comentario agregado:', data);
  }

  openCreateModal(): void {
    console.log('Abrir modal de crear post');
  }
}