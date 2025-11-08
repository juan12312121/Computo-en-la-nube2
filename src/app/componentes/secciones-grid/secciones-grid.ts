import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Publicacion, PublicacionesService } from '../../core/servicios/publicaciones/publicaciones';
import { CrearSeccionRequest, SeccionesService } from '../../core/servicios/secciones/secciones';
import { Theme } from '../../core/servicios/temas';

export interface Section {
  id: number;
  name: string;
  icon: string;
  color: string;
  posts: number;
}

@Component({
  selector: 'app-secciones-grid',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './secciones-grid.html',
  styleUrl: './secciones-grid.css'
})
export class SeccionesGrid {
  @Input() sections: Section[] = [];
  @Input() currentTheme!: Theme;
  @Output() sectionSelected = new EventEmitter<number>();
  @Output() sectionCreated = new EventEmitter<void>();

  showModal = false;
  showCreateModal = false;
  selectedSection: Section | null = null;
  publicaciones: Publicacion[] = [];
  cargandoPublicaciones = false;
  errorCargaPublicaciones = '';
  
  mostrarPublicacionesModal = false;
  publicacionesSeleccionadas: number[] = [];
  
  nuevaSeccion: CrearSeccionRequest = {
    nombre: '',
    icono: 'fa-book',
    color: 'from-blue-500 to-blue-600'
  };
  
  creandoSeccion = false;
  errorCreacion = '';

  iconosDisponibles = [
    'fa-book',
    'fa-graduation-cap',
    'fa-pen',
    'fa-calculator',
    'fa-flask',
    'fa-microscope',
    'fa-atom',
    'fa-dna',
    'fa-laptop-code',
    'fa-code',
    'fa-palette',
    'fa-music',
    'fa-language',
    'fa-globe',
    'fa-chart-line',
    'fa-briefcase',
    'fa-lightbulb',
    'fa-puzzle-piece',
    'fa-users',
    'fa-calendar-alt',
    'fa-clipboard-list',
    'fa-star',
    'fa-award',
    'fa-trophy'
  ];

  coloresDisponibles = [
    { name: 'Azul', value: 'from-blue-500 to-blue-600' },
    { name: 'Púrpura', value: 'from-purple-500 to-purple-600' },
    { name: 'Verde', value: 'from-green-500 to-green-600' },
    { name: 'Naranja', value: 'from-orange-500 to-orange-600' },
    { name: 'Rojo', value: 'from-red-500 to-red-600' },
    { name: 'Índigo', value: 'from-indigo-500 to-indigo-600' },
    { name: 'Teal', value: 'from-teal-500 to-teal-600' },
    { name: 'Cyan', value: 'from-cyan-500 to-cyan-600' },
    { name: 'Rosa', value: 'from-pink-500 to-pink-600' },
    { name: 'Amarillo', value: 'from-yellow-500 to-yellow-600' }
  ];

  constructor(
    private seccionesService: SeccionesService,
    private publicacionesService: PublicacionesService
  ) {}

  private getApiBaseUrl(): string {
    const host = window.location.hostname;
    return (host === 'localhost' || host === '127.0.0.1') 
      ? 'http://localhost:3000' 
      : 'http://18.190.26.244:3000';
  }

  onSectionClick(sectionId: number): void {
    this.selectedSection = this.sections.find(s => s.id === sectionId) || null;
    this.showModal = true;
    document.body.style.overflow = 'hidden';
    this.sectionSelected.emit(sectionId);
  }

  mostrarListaPublicaciones(): void {
    this.mostrarPublicacionesModal = true;
    this.publicacionesSeleccionadas = [];
    this.cargarPublicaciones();
  }

  cerrarPublicacionesModal(): void {
    this.mostrarPublicacionesModal = false;
    this.publicacionesSeleccionadas = [];
  }

  toggleSeleccionPublicacion(publicacionId: number): void {
    const index = this.publicacionesSeleccionadas.indexOf(publicacionId);
    if (index > -1) {
      this.publicacionesSeleccionadas.splice(index, 1);
    } else {
      this.publicacionesSeleccionadas.push(publicacionId);
    }
  }

  limpiarSeleccion(): void {
    this.publicacionesSeleccionadas = [];
  }

  agregarPublicacionesASeccion(): void {
    if (!this.selectedSection || this.publicacionesSeleccionadas.length === 0) {
      return;
    }

    console.log('🔗 Agregando publicaciones:', this.publicacionesSeleccionadas);
    console.log('📁 A la sección:', this.selectedSection.id);

    this.cerrarPublicacionesModal();
  }

  cargarPublicaciones(): void {
    this.cargandoPublicaciones = true;
    this.publicaciones = [];
    this.errorCargaPublicaciones = '';

    this.publicacionesService.obtenerMisPublicaciones().subscribe({
      next: (response) => {
        if (response.success) {
          this.publicaciones = response.data;
          console.log('✅ Mis publicaciones cargadas:', this.publicaciones.length);
          console.log('📋 IDs de publicaciones:', this.publicaciones.map(p => p.id));
        } else {
          this.errorCargaPublicaciones = response.message || 'No se pudieron cargar tus publicaciones';
        }
        this.cargandoPublicaciones = false;
      },
      error: (error) => {
        console.error('❌ Error al cargar mis publicaciones:', error);
        this.errorCargaPublicaciones = 'Error al cargar tus publicaciones. Intenta de nuevo.';
        this.cargandoPublicaciones = false;
      }
    });
  }

  formatearFecha(fechaStr: string): string {
    const fecha = new Date(fechaStr);
    const ahora = new Date();
    const diff = ahora.getTime() - fecha.getTime();
    const minutos = Math.floor(diff / 60000);
    const horas = Math.floor(diff / 3600000);
    const dias = Math.floor(diff / 86400000);

    if (minutos < 1) return 'ahora';
    if (minutos < 60) return `hace ${minutos} min`;
    if (horas < 24) return `hace ${horas}h`;
    if (dias === 1) return 'ayer';
    if (dias < 7) return `hace ${dias} días`;
    return fecha.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  }

  obtenerAvatarUrl(publicacion: Publicacion): string {
    if (publicacion.foto_perfil_url) {
      if (publicacion.foto_perfil_url.startsWith('http')) {
        return publicacion.foto_perfil_url;
      }
      return `${this.getApiBaseUrl()}${publicacion.foto_perfil_url}`;
    }
    const nombre = publicacion.nombre_completo || publicacion.nombre_usuario || 'Usuario';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=random&color=fff`;
  }

  obtenerImagenUrl(imagenUrl: string): string {
    if (!imagenUrl) return '';
    if (imagenUrl.startsWith('http')) {
      return imagenUrl;
    }
    return `${this.getApiBaseUrl()}${imagenUrl}`;
  }

  obtenerNombreAutor(publicacion: Publicacion): string {
    return publicacion.nombre_completo || publicacion.nombre_usuario || 'Usuario Anónimo';
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedSection = null;
    this.publicaciones = [];
    this.mostrarPublicacionesModal = false;
    this.publicacionesSeleccionadas = [];
    document.body.style.overflow = 'auto';
  }

  openCreateModal(): void {
    this.showCreateModal = true;
    this.errorCreacion = '';
    this.nuevaSeccion = {
      nombre: '',
      icono: 'fa-book',
      color: 'from-blue-500 to-blue-600'
    };
    document.body.style.overflow = 'hidden';
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.errorCreacion = '';
    document.body.style.overflow = 'auto';
  }

  seleccionarIcono(icono: string): void {
    this.nuevaSeccion.icono = icono;
  }

  seleccionarColor(color: string): void {
    this.nuevaSeccion.color = color;
  }

  crearSeccion(): void {
    if (!this.nuevaSeccion.nombre.trim()) {
      this.errorCreacion = 'El nombre de la sección es obligatorio';
      return;
    }

    if (this.nuevaSeccion.nombre.trim().length < 3) {
      this.errorCreacion = 'El nombre debe tener al menos 3 caracteres';
      return;
    }

    if (this.nuevaSeccion.nombre.trim().length > 50) {
      this.errorCreacion = 'El nombre no puede exceder 50 caracteres';
      return;
    }

    this.creandoSeccion = true;
    this.errorCreacion = '';

    this.seccionesService.crearSeccion(this.nuevaSeccion).subscribe({
      next: (response) => {
        console.log('✅ Sección creada:', response);
        this.creandoSeccion = false;
        this.closeCreateModal();
        this.sectionCreated.emit();
      },
      error: (error) => {
        console.error('❌ Error al crear sección:', error);
        this.creandoSeccion = false;
        this.errorCreacion = error.error?.mensaje || 'Error al crear la sección. Intenta de nuevo.';
      }
    });
  }

  onModalBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.closeModal();
    }
  }

  onCreateModalBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.closeCreateModal();
    }
  }

  onPublicacionesModalBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.cerrarPublicacionesModal();
    }
  }
}