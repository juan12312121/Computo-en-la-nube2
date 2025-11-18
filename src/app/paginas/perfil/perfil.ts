import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { Document, DocumentosLista } from '../../componentes/documentos-lista/documentos-lista';
import { FotosPerfil } from '../../componentes/fotos-perfil/fotos-perfil';
import { ModalCambiarBanner } from '../../componentes/modal-cambiar-banner/modal-cambiar-banner';
import { FormularioEditarPerfil, ModalEditarPerfil } from '../../componentes/modal-editar-perfil/modal-editar-perfil';
import { ModalSeguidores, TipoModal } from '../../componentes/modal-seguidores/modal-seguidores';
import { Navbar } from '../../componentes/navbar/navbar';
import { ProfileErrorComponent } from '../../componentes/profile-error/profile-error';
import { ProfileHeaderComponent, UsuarioPerfil } from '../../componentes/profile-header/profile-header';
import { ProfileLoadingComponent } from '../../componentes/profile-loading/profile-loading';
import { ProfileTabsComponent, TabType } from '../../componentes/profile-tabs/profile-tabs';
import { PublicacionesPerfil } from '../../componentes/publicaciones-perfil/publicaciones-perfil';
import { SeccionesGrid, Section } from '../../componentes/secciones-grid/secciones-grid';
import { AutenticacionService, Usuario } from '../../core/servicios/autenticacion/autenticacion';
import { FotosService } from '../../core/servicios/fotos/fotos';
import { Publicacion, PublicacionesService } from '../../core/servicios/publicaciones/publicaciones';
import { SeccionesService, Section as ServiceSection } from '../../core/servicios/secciones/secciones';
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
    Navbar,
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
  // 🆕 URLs base para API y S3
  private readonly apiBaseUrl = this.getBaseUrl('api');
  private readonly s3BaseUrl = this.getBaseUrl('s3');

  usuario: UsuarioPerfil | null = null;
  usuarioActual: Usuario | null = null;
  currentTheme: Theme;
  
  // Estados de carga
  cargandoPerfil = true;
  cargandoPublicaciones = true;
  cargandoFotos = false;
  cargandoSeguir = false;
  cargandoSecciones = false;
  guardandoPerfil = false;
  guardandoBanner = false;

  // Estados de error
  errorCarga = false;
  errorGuardado = false;
  errorBanner = '';
  mensajeError = '';
  
  // UI
  isOwnProfile = true;
  activeTab: TabType = 'todo';
  showEditModal = false;
  showBannerModal = false;
  showSeguidoresModal = false;
  tipoModalSeguidores: TipoModal = 'seguidores';
  estaSiguiendo = false;
  
  // Datos
  publicacionesReales: Publicacion[] = [];
  photos: Photo[] = [];
  sections: Section[] = [];
  
  readonly documents: Document[] = [
    { id: 1, name: 'Apuntes de Algoritmos.pdf', description: 'Notas completas del curso de Estructuras de Datos y Algoritmos', icon: 'fa-file-pdf', color: 'text-red-500', size: '2.4 MB', date: 'Hace 3 días' },
    { id: 2, name: 'Proyecto Final - Desarrollo Web.zip', description: 'Código fuente completo del proyecto de fin de semestre', icon: 'fa-file-archive', color: 'text-yellow-500', size: '15.8 MB', date: 'Hace 1 semana' },
    { id: 3, name: 'Presentación Machine Learning.pptx', description: 'Slides de la presentación del modelo de clasificación', icon: 'fa-file-powerpoint', color: 'text-orange-500', size: '8.2 MB', date: 'Hace 2 semanas' },
    { id: 4, name: 'Resumen Bases de Datos.docx', description: 'Resumen de SQL, NoSQL y optimización de queries', icon: 'fa-file-word', color: 'text-blue-500', size: '1.1 MB', date: 'Hace 1 mes' },
    { id: 5, name: 'Guía de React Hooks.pdf', description: 'Tutorial completo sobre useState, useEffect y hooks personalizados', icon: 'fa-file-pdf', color: 'text-red-500', size: '3.7 MB', date: 'Hace 1 mes' },
    { id: 6, name: 'Dataset - Análisis de Datos.csv', description: 'Dataset para el proyecto de análisis estadístico', icon: 'fa-file-csv', color: 'text-green-500', size: '5.3 MB', date: 'Hace 2 meses' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private themeService: ThemeService,
    private usuarioService: UsuarioService,
    private publicacionesService: PublicacionesService,
    private fotosService: FotosService,
    private authService: AutenticacionService,
    private seguidorService: SeguidorService,
    private seccionesService: SeccionesService,
    private route: ActivatedRoute
  ) {
    this.currentTheme = this.themeService.getCurrentTheme();
  }

  ngOnInit() {
    this.themeService.currentTheme$
      .pipe(takeUntil(this.destroy$))
      .subscribe(theme => this.currentTheme = theme);

    this.usuarioActual = this.authService.currentUserValue;

    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const userId = params['id'];
        userId ? this.cargarPerfilUsuario(Number(userId)) : this.cargarMiPerfil();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // 🆕 Método mejorado para obtener URLs base
  private getBaseUrl(tipo: 'api' | 's3' = 'api'): string {
    const host = window.location.hostname;
    const apiBase = (host === 'localhost' || host === '127.0.0.1')
      ? 'http://localhost:3000'
      : 'http://3.146.83.30:3000';
    const s3Base = 'https://redstudent-uploads.s3.us-east-2.amazonaws.com';
    return tipo === 's3' ? s3Base : apiBase;
  }

  // 🆕 Método público para formatear URLs de imágenes desde S3
 public formatImageUrl(url: string | undefined | null): string | null {
  if (!url) return null;
  
  // Si la URL ya apunta a S3, devolverla tal como está (sin modificar)
  if (url.includes('s3.us-east-2.amazonaws.com') || url.includes('s3.amazonaws.com')) {
    return url; // ✅ Devolver sin cambios
  }
  
  // Si es una URL del servidor API, extraer solo la ruta
  if (url.startsWith('http://') || url.startsWith('https://')) {
    const match = url.match(/\/uploads\/.+$/);
    if (match) {
      // Construir URL de S3 sin duplicar /uploads/
      const rutaLimpia = match[0].replace('/uploads/', '');
      return `${this.s3BaseUrl}/${rutaLimpia}`;
    }
  }
  
  // Si es solo un nombre de archivo (sin ruta), determinar el tipo y construir la ruta
  if (!url.includes('/') && !url.startsWith('uploads')) {
    let carpeta = 'publicaciones'; // Por defecto
    
    if (url.startsWith('foto_perfil-') || url.includes('perfil')) {
      carpeta = 'perfiles'; // ✅ Usar 'perfiles' (con s)
    } else if (url.startsWith('foto_portada-') || url.includes('portada')) {
      carpeta = 'portadas';
    }
    
    return `${this.s3BaseUrl}/${carpeta}/${url}`;
  }
  
  // Si es una ruta relativa, construir URL completa con S3
  const cleanPath = url.replace(/^\/+/, '');
  return `${this.s3BaseUrl}/${cleanPath}`;
}
  
  // 🆕 Método público para obtener la URL base de S3 (para pasar a componentes hijos)
  public getS3BaseUrl(): string {
    return this.s3BaseUrl;
  }

  // 🆕 Método público para obtener imagen de perfil
  getProfileImage(): string | null {
    return this.formatImageUrl(this.usuario?.foto_perfil_url);
  }

  // 🆕 Método público para obtener imagen de portada
  getCoverImage(): string | null {
    return this.formatImageUrl(this.usuario?.foto_portada_url);
  }

  private resetEstados(): void {
    this.cargandoPerfil = true;
    this.cargandoPublicaciones = true;
    this.errorCarga = false;
  }

  cargarMiPerfil(): void {
    this.resetEstados();
    this.isOwnProfile = true;

    this.usuarioService.obtenerMiPerfil()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (responsePerfil) => {
          if (responsePerfil.success && responsePerfil.data) {
            this.usuario = responsePerfil.data;
            if (this.usuario && this.usuarioActual) {
              this.cargarContadores(this.usuarioActual.id);
            }
            this.cargandoPerfil = false;
            this.cargarPublicaciones();
            this.cargarMisFotos();
            this.cargarSecciones();
          } else {
            this.handleError();
          }
        },
        error: () => this.handleError()
      });
  }

  cargarPerfilUsuario(userId: number): void {
    this.resetEstados();
    this.isOwnProfile = this.usuarioActual?.id === userId;

    this.usuarioService.obtenerPerfil(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (responsePerfil) => {
          if (responsePerfil.success && responsePerfil.data) {
            this.usuario = responsePerfil.data;
            this.cargarContadores(userId);
            this.cargandoPerfil = false;
            
            this.isOwnProfile ? this.cargarMisFotos() : this.cargarFotosUsuario(userId);
            this.cargarPublicacionesUsuario(userId);
            this.cargarSecciones();
            
            if (!this.isOwnProfile && this.usuarioActual) {
              this.verificarSeguimiento();
            }
          } else {
            this.handleError();
          }
        },
        error: () => this.handleError()
      });
  }

  private cargarSecciones(): void {
  this.cargandoSecciones = true;
  this.seccionesService.obtenerSecciones()
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (secciones: ServiceSection[]) => {
        console.log('✅ Secciones cargadas:', secciones);
        
        // ✅ Mapea pero mantén los nombres en español
        this.sections = secciones.map(s => ({
          id: s.id,
          nombre: s.nombre,        // ✅ era: name
          icono: s.icono,          // ✅ era: icon
          color: s.color,
          total_posts: s.total_posts, // ✅ era: posts
          usuario_id: s.usuario_id,
          fecha_creacion: s.fecha_creacion
        }));
        
        this.cargandoSecciones = false;
      },
      error: (error) => {
        console.error('❌ Error al cargar secciones:', error);
        this.sections = [];
        this.cargandoSecciones = false;
      }
    });
}

  recargarSecciones(): void {
    console.log('🔄 Recargando secciones...');
    this.cargarSecciones();
  }

  private handleError(): void {
    this.errorCarga = true;
    this.cargandoPerfil = false;
    this.cargandoPublicaciones = false;
  }

  private cargarPublicaciones(): void {
    this.publicacionesService.obtenerMisPublicaciones()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => this.procesarPublicaciones(response),
        error: () => this.procesarPublicacionesError()
      });
  }

  private cargarPublicacionesUsuario(userId: number): void {
    this.publicacionesService.obtenerPublicacionesUsuario(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => this.procesarPublicaciones(response),
        error: () => this.procesarPublicacionesError()
      });
  }

  private procesarPublicaciones(response: any): void {
    this.publicacionesReales = response.success && response.data ? response.data : [];
    this.cargandoPublicaciones = false;
  }

  private procesarPublicacionesError(): void {
    console.error('Error al cargar publicaciones');
    this.publicacionesReales = [];
    this.cargandoPublicaciones = false;
  }

  // 🆕 Métodos mejorados para cargar fotos desde S3
  private cargarMisFotos(): void {
    this.cargandoFotos = true;
    this.fotosService.obtenerMisFotos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (fotos) => { 
          // Procesar URLs de fotos para S3
          this.photos = fotos.map(foto => {
            // Determinar el tipo de foto basado en el nombre del archivo
            let tipo: 'perfil' | 'portada' | 'publicacion' = foto.tipo || 'publicacion';
            
            if (typeof foto.url === 'string') {
              if (foto.url.includes('foto_perfil') || foto.url.includes('perfil')) {
                tipo = 'perfil';
              } else if (foto.url.includes('foto_portada') || foto.url.includes('portada')) {
                tipo = 'portada';
              }
            }
            
            const urlProcesada = this.formatImageUrl(foto.url);
            console.log('🔄 Procesando foto:', {
              tipo,
              original: foto.url,
              procesada: urlProcesada
            });
            
            return {
              ...foto,
              tipo,
              url: urlProcesada || foto.url
            };
          });
          this.cargandoFotos = false;
          console.log('📸 Fotos cargadas desde S3:', this.photos);
        },
        error: () => { 
          console.error('Error al cargar fotos'); 
          this.photos = []; 
          this.cargandoFotos = false; 
        }
      });
  }

  private cargarFotosUsuario(userId: number): void {
    this.cargandoFotos = true;
    this.fotosService.obtenerFotosUsuario(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (fotos) => { 
          // Procesar URLs de fotos para S3
          this.photos = fotos.map(foto => {
            // Determinar el tipo de foto basado en el nombre del archivo
            let tipo: 'perfil' | 'portada' | 'publicacion' = foto.tipo || 'publicacion';
            
            if (typeof foto.url === 'string') {
              if (foto.url.includes('foto_perfil') || foto.url.includes('perfil')) {
                tipo = 'perfil';
              } else if (foto.url.includes('foto_portada') || foto.url.includes('portada')) {
                tipo = 'portada';
              }
            }
            
            const urlProcesada = this.formatImageUrl(foto.url);
            console.log('🔄 Procesando foto de usuario:', {
              tipo,
              original: foto.url,
              procesada: urlProcesada
            });
            
            return {
              ...foto,
              tipo,
              url: urlProcesada || foto.url
            };
          });
          this.cargandoFotos = false;
          console.log('📸 Fotos de usuario cargadas desde S3:', this.photos);
        },
        error: () => { 
          console.error('Error al cargar fotos'); 
          this.photos = []; 
          this.cargandoFotos = false; 
        }
      });
  }

  reintentarCarga(): void {
    const userId = this.route.snapshot.params['id'];
    userId ? this.cargarPerfilUsuario(Number(userId)) : this.cargarMiPerfil();
  }

  private cargarContadores(userId: number): void {
    this.seguidorService.listarSeguidores(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('📊 Respuesta seguidores para contador:', response);
          if (this.usuario && response.success && response.data) {
            this.usuario.total_seguidores = response.data.total || 0;
            console.log('✅ Total seguidores actualizado:', this.usuario.total_seguidores);
          }
        },
        error: (error) => {
          console.error('❌ Error al cargar seguidores:', error);
          if (this.usuario && !this.usuario.total_seguidores) {
            this.usuario.total_seguidores = 0;
          }
        }
      });

    this.seguidorService.listarSeguidos(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('📊 Respuesta seguidos para contador:', response);
          if (this.usuario && response.success && response.data) {
            this.usuario.total_siguiendo = response.data.total || 0;
            console.log('✅ Total seguidos actualizado:', this.usuario.total_siguiendo);
          }
        },
        error: (error) => {
          console.error('❌ Error al cargar seguidos:', error);
          if (this.usuario && !this.usuario.total_siguiendo) {
            this.usuario.total_siguiendo = 0;
          }
        }
      });
  }

  private verificarSeguimiento(): void {
    if (!this.usuarioActual || !this.usuario) {
      console.log('⚠️ No se puede verificar seguimiento: falta usuario actual o perfil');
      return;
    }

    console.log('🔍 Verificando si sigo al usuario:', this.usuario.id);

    this.seguidorService.verificar(this.usuario.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('📦 Respuesta verificación:', response);
          if (response.success && response.data) {
            this.estaSiguiendo = response.data.following || false;
            console.log('✅ Estado de seguimiento:', this.estaSiguiendo);
          }
        },
        error: (error) => {
          console.error('❌ Error al verificar seguimiento:', error);
          this.estaSiguiendo = false;
        }
      });
  }

  toggleSeguir(): void {
    if (!this.usuarioActual) {
      alert('Debes iniciar sesión para seguir usuarios');
      return;
    }

    if (!this.usuario || this.isOwnProfile || this.cargandoSeguir) {
      console.log('⚠️ No se puede seguir:', {
        tieneUsuario: !!this.usuario,
        esPropiosPerfil: this.isOwnProfile,
        cargando: this.cargandoSeguir
      });
      return;
    }

    this.cargandoSeguir = true;
    console.log('🔄 Toggle seguir usuario:', this.usuario.id);

    this.seguidorService.toggle(this.usuario.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('📦 Respuesta toggle:', response);
          
          if (response.success && response.data) {
            const nuevoEstado = response.data.following ?? false;
            this.estaSiguiendo = nuevoEstado;
            
            console.log('✅ Nuevo estado de seguimiento:', nuevoEstado);
            
            if (this.usuario) {
              const cambio = nuevoEstado ? 1 : -1;
              this.usuario.total_seguidores = Math.max(
                0, 
                (this.usuario.total_seguidores || 0) + cambio
              );
              console.log('📊 Contador actualizado:', this.usuario.total_seguidores);
            }
          } else {
            alert('Error al procesar la solicitud');
          }
          
          this.cargandoSeguir = false;
        },
        error: (error) => {
          console.error('❌ Error al hacer toggle:', error);
          const mensajeError = this.getMensajeError(error);
          alert(mensajeError);
          this.cargandoSeguir = false;
        }
      });
  }

  private getMensajeError(error: any): string {
    if (error.status === 401) return 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente';
    if (error.status === 404) return 'Usuario no encontrado';
    return error.error?.mensaje || 'Error al procesar la solicitud de seguimiento';
  }

  abrirSeguidores(): void {
    console.log('👥 Abriendo modal de seguidores');
    this.tipoModalSeguidores = 'seguidores';
    this.toggleBodyOverflow(true);
    this.showSeguidoresModal = true;
  }

  abrirSiguiendo(): void {
    console.log('👥 Abriendo modal de seguidos');
    this.tipoModalSeguidores = 'seguidos';
    this.toggleBodyOverflow(true);
    this.showSeguidoresModal = true;
  }

  cerrarModalSeguidores(): void {
    this.showSeguidoresModal = false;
    this.toggleBodyOverflow(false);
  }

  private toggleBodyOverflow(hidden: boolean): void {
    document.body.style.overflow = hidden ? 'hidden' : 'auto';
  }

  getInitials(): string {
    if (!this.usuario) return '??';
    const names = this.usuario.nombre_completo.trim().split(' ');
    return names.length >= 2 
      ? (names[0][0] + names[1][0]).toUpperCase()
      : names[0].substring(0, 2).toUpperCase();
  }

  toggleProfileMode(): void {
    this.isOwnProfile ? this.abrirModalEdicion() : this.toggleSeguir();
  }

  getButtonText(): string {
    if (this.isOwnProfile) return 'Editar perfil';
    return this.cargandoSeguir ? 'Cargando...' : (this.estaSiguiendo ? 'Siguiendo' : 'Seguir');
  }

  getButtonIcon(): string {
    if (this.isOwnProfile) return 'fas fa-edit';
    return this.estaSiguiendo ? 'fas fa-user-check' : 'fas fa-user-plus';
  }

  abrirModalEdicion(): void {
    this.showEditModal = true;
    this.errorGuardado = false;
    this.toggleBodyOverflow(true);
  }

  cerrarModalEdicion(): void {
    this.showEditModal = false;
    this.guardandoPerfil = false;
    this.errorGuardado = false;
    this.mensajeError = '';
    this.toggleBodyOverflow(false);
  }

  guardarPerfil(data: {formulario: FormularioEditarPerfil, archivo: File | null}): void {
    if (!this.usuario) return;

    this.guardandoPerfil = true;
    this.errorGuardado = false;

    const formData = this.construirFormData(data);
    
    if (!formData.has('nombre_completo') && !formData.has('biografia') && !formData.has('ubicacion') && !formData.has('carrera') && !formData.has('foto_perfil')) {
      this.cerrarModalEdicion();
      return;
    }

    this.usuarioService.actualizarPerfil(formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.usuario = { ...this.usuario, ...response.data };
            this.guardandoPerfil = false;
            this.cerrarModalEdicion();
            this.cargarMisFotos();
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

  private construirFormData(data: {formulario: FormularioEditarPerfil, archivo: File | null}): FormData {
    const formData = new FormData();
    const campos = ['nombre_completo', 'biografia', 'ubicacion', 'carrera'] as const;

    campos.forEach(campo => {
      if (data.formulario[campo] !== (this.usuario?.[campo] || '')) {
        formData.append(campo, data.formulario[campo]);
      }
    });

    if (data.archivo) formData.append('foto_perfil', data.archivo);
    return formData;
  }

  abrirModalCambiarBanner(): void {
    this.showBannerModal = true;
    this.errorBanner = '';
    this.toggleBodyOverflow(true);
  }

  cerrarModalBanner(): void {
    this.showBannerModal = false;
    this.guardandoBanner = false;
    this.errorBanner = '';
    this.toggleBodyOverflow(false);
  }

  guardarBanner(archivo: File): void {
    this.actualizarBanner(archivo);
  }

  eliminarBanner(): void {
    const formData = new FormData();
    formData.append('foto_portada', '');
    this.actualizarBanner(formData);
  }

  private actualizarBanner(archivoOFormData: File | FormData): void {
    this.guardandoBanner = true;
    this.errorBanner = '';

    const formData = archivoOFormData instanceof FormData ? archivoOFormData : new FormData();
    if (archivoOFormData instanceof File) {
      formData.append('foto_portada', archivoOFormData);
    }

    this.usuarioService.actualizarPerfil(formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.usuario = { ...this.usuario, ...response.data };
            this.guardandoBanner = false;
            this.cerrarModalBanner();
            this.cargarMisFotos();
          }
        },
        error: (error) => {
          console.error('Error al actualizar banner:', error);
          this.errorBanner = error.error?.mensaje || 'Error al actualizar la portada';
          this.guardandoBanner = false;
        }
      });
  }

  switchTab(tab: TabType): void {
    this.activeTab = tab;
  }

  onSectionSelected(sectionId: number): void {
    console.log('Sección seleccionada:', sectionId);
  }

  onDocumentDownload(docId: number): void {
    console.log('Descargar documento:', docId);
  }

  onLikeToggled(postId: number): void {
    console.log('Like toggled en post:', postId);
  }

  onCommentAdded(data: {postId: number, comment: string}): void {
    this.mostrarNotificacion('Comentario publicado correctamente', 'success');
  }

  onPostShared(data: {postId: number, platform: string}): void {
    this.mostrarNotificacion(`Publicación compartida en ${data.platform}`, 'success');
  }

  private mostrarNotificacion(mensaje: string, tipo: 'success' | 'error' | 'info' = 'info'): void {
    console.log(`[${tipo.toUpperCase()}] ${mensaje}`);
  }

  openCreateModal(): void {
    console.log('Abrir modal de crear post');
  }
}