// secciones-grid.component.ts - CON DETECCIÓN DE TEMA PIZARRA

import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Publicacion } from '../../core/modelos/publicacion.model';
import { SeccionesService } from '../../core/servicios/secciones/secciones';
import { CrearSeccionRequest } from '../../core/modelos/seccion.model';
import { PublicacionesService } from '../../core/servicios/publicaciones/publicaciones';
import { Theme } from '../../core/servicios/temas';
import { forkJoin } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Section {
  id: number;
  nombre: string;
  icono: string;
  color: string;
  total_posts: number;
  usuario_id: number;
  fecha_creacion: string;
}

@Component({
  selector: 'app-secciones-grid',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './secciones-grid.html',
  styleUrl: './secciones-grid.css'
})
export class SeccionesGrid implements OnInit, OnChanges {
  @Input() sections: Section[] = [];
  @Input() currentTheme!: Theme;
  @Input() usuarioId?: number;
  @Input() soloLectura: boolean = false;

  @Output() sectionSelected = new EventEmitter<number>();
  @Output() sectionCreated = new EventEmitter<void>();
  @Output() sectionUpdated = new EventEmitter<void>();

  showModal = false;
  showCreateModal = false;
  mostrarPublicacionesModal = false;

  selectedSection: Section | null = null;
  publicaciones: Publicacion[] = [];
  publicacionesSeleccionadas: number[] = [];

  cargandoPublicaciones = false;
  creandoSeccion = false;
  agregandoPublicaciones = false;

  errorCargaPublicaciones = '';
  errorCreacion = '';
  mensajeExito = '';
  mensajeError = '';

  // ⭐ COMPUTED: Si es propietario (inverso de soloLectura)
  get esPropietario(): boolean {
    return !this.soloLectura;
  }

  // ⭐ NUEVO: Computed para detectar si es tema Pizarra u oscuro
  get esTemaOscuroOPizarra(): boolean {
    return this.currentTheme.id === 'slate' ||
      this.currentTheme.id === 'midnight' ||
      this.currentTheme.id === 'neon' ||
      this.currentTheme.id === 'toxic';
  }

  // ⭐ NUEVO: Clase de texto adaptada para Pizarra
  get textoPrimariaAdaptado(): string {
    if (this.currentTheme.id === 'slate') {
      return 'text-slate-900'; // Negro más fuerte para Pizarra
    }
    return this.currentTheme.textPrimaryClass;
  }

  // ⭐ NUEVO: Clase de texto secundaria adaptada para Pizarra
  get textoSecundariaAdaptada(): string {
    if (this.currentTheme.id === 'slate') {
      return 'text-slate-700'; // Gris oscuro para Pizarra
    }
    return this.currentTheme.textSecondaryClass;
  }

  // ⭐ NUEVO: Fondo de acento adaptado para Pizarra
  get fondoAcentoAdaptado(): string {
    if (this.currentTheme.id === 'slate') {
      return 'bg-slate-300'; // Fondo más claro para iconos en Pizarra
    }
    return this.currentTheme.accentBg;
  }

  nuevaSeccion: CrearSeccionRequest = {
    nombre: '',
    icono: 'fa-book',
    color: 'from-blue-500 to-blue-600'
  };

  iconosDisponibles = [
    'fa-book', 'fa-graduation-cap', 'fa-pen', 'fa-calculator',
    'fa-flask', 'fa-microscope', 'fa-atom', 'fa-dna',
    'fa-laptop-code', 'fa-code', 'fa-palette', 'fa-music',
    'fa-language', 'fa-globe', 'fa-chart-line', 'fa-briefcase',
    'fa-lightbulb', 'fa-puzzle-piece', 'fa-users', 'fa-calendar-alt',
    'fa-clipboard-list', 'fa-star', 'fa-award', 'fa-trophy'
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
  ) { }

  ngOnInit(): void {
    console.log('═══════════════════════════════════════════════');
    console.log('🔧 SeccionesGrid inicializado');
    console.log('═══════════════════════════════════════════════');
    console.log('📊 INPUTS RECIBIDOS:');
    console.log('  👤 usuarioId:', this.usuarioId);
    console.log('  🔐 soloLectura:', this.soloLectura);
    console.log('  📚 sections.length:', this.sections.length);
    console.log('  ✏️ esPropietario:', this.esPropietario);
    console.log('  🎨 Tema actual:', this.currentTheme.id);
    console.log('  🌙 Es tema Pizarra:', this.currentTheme.id === 'slate');
    console.log('═══════════════════════════════════════════════');

    if (this.sections.length > 0) {
      console.log('📋 Primeras secciones:', this.sections.slice(0, 2));
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('═══════════════════════════════════════════════');
    console.log('🔄 ngOnChanges - Cambios detectados');
    console.log('═══════════════════════════════════════════════');

    if (changes['usuarioId']) {
      console.log('👤 usuarioId cambió:');
      console.log('  Anterior:', changes['usuarioId'].previousValue);
      console.log('  Nuevo:', changes['usuarioId'].currentValue);
    }

    if (changes['soloLectura']) {
      console.log('🔐 soloLectura cambió:');
      console.log('  Anterior:', changes['soloLectura'].previousValue);
      console.log('  Nuevo:', changes['soloLectura'].currentValue);
      console.log('  ✏️ esPropietario ahora:', this.esPropietario);
    }

    if (changes['sections']) {
      console.log('📚 sections cambió:');
      console.log('  Anterior length:', changes['sections'].previousValue?.length || 0);
      console.log('  Nuevo length:', changes['sections'].currentValue?.length || 0);
    }

    if (changes['currentTheme']) {
      console.log('🎨 currentTheme cambió:');
      console.log('  Tema actual:', this.currentTheme?.id);
      console.log('  Es Pizarra:', this.currentTheme?.id === 'slate');
    }

    console.log('═══════════════════════════════════════════════');
  }

  // getApiBaseUrl eliminada - usar environment.socketUrl

  onSectionClick(sectionId: number): void {
    this.selectedSection = this.sections.find(s => s.id === sectionId) || null;
    this.showModal = true;
    document.body.style.overflow = 'hidden';
    this.sectionSelected.emit(sectionId);
    this.cargarPostsDeSeccion(sectionId);
  }

  openCreateModal(): void {
    if (!this.esPropietario) {
      console.warn('⚠️ Usuario no autorizado para crear secciones');
      return;
    }

    this.showCreateModal = true;
    this.errorCreacion = '';
    this.nuevaSeccion = {
      nombre: '',
      icono: 'fa-book',
      color: 'from-blue-500 to-blue-600'
    };
    document.body.style.overflow = 'hidden';
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedSection = null;
    this.publicaciones = [];
    this.mostrarPublicacionesModal = false;
    this.publicacionesSeleccionadas = [];
    this.mensajeExito = '';
    this.mensajeError = '';
    document.body.style.overflow = 'auto';
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
    if (!this.esPropietario) {
      this.errorCreacion = 'No tienes permiso para crear secciones';
      return;
    }

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
        this.creandoSeccion = false;
        this.closeCreateModal();
        this.sectionCreated.emit();
      },
      error: (error) => {
        this.creandoSeccion = false;
        this.errorCreacion = error.error?.error || error.error?.mensaje || 'Error al crear la sección';
      }
    });
  }

  cargarPostsDeSeccion(seccionId: number): void {
    console.log('═══════════════════════════════════════════════');
    console.log('📂 cargarPostsDeSeccion()');
    console.log('═══════════════════════════════════════════════');
    console.log('  Sección ID:', seccionId);
    console.log('  Usuario ID:', this.usuarioId);
    console.log('  Es propietario:', this.esPropietario);
    console.log('═══════════════════════════════════════════════');

    this.cargandoPublicaciones = true;

    if (this.soloLectura && this.usuarioId) {
      console.log('🌍 Usando endpoint PÚBLICO');
      console.log('  URL: /api/secciones/usuario/' + this.usuarioId + '/seccion/' + seccionId);

      this.seccionesService.obtenerSeccionPublica(this.usuarioId, seccionId).subscribe({
        next: (data) => {
          console.log('✅ Respuesta PÚBLICA recibida:', data);
          this.publicaciones = data.posts || [];
          this.cargandoPublicaciones = false;
          console.log('📄 Posts cargados (público):', this.publicaciones.length);
        },
        error: (error) => {
          console.error('❌ Error al cargar sección pública:', error);
          this.publicaciones = [];
          this.cargandoPublicaciones = false;
        }
      });
    } else {
      console.log('🔐 Usando endpoint PRIVADO');
      console.log('  URL: /api/secciones/' + seccionId);

      this.seccionesService.obtenerSeccion(seccionId).subscribe({
        next: (data) => {
          console.log('✅ Respuesta PRIVADA recibida:', data);
          this.publicaciones = data.posts || [];
          this.cargandoPublicaciones = false;
          console.log('📄 Posts cargados (privado):', this.publicaciones.length);
        },
        error: (error) => {
          console.error('❌ Error al cargar sección privada:', error);
          this.publicaciones = [];
          this.cargandoPublicaciones = false;
        }
      });
    }
    console.log('═══════════════════════════════════════════════');
  }

  mostrarListaPublicaciones(): void {
    if (!this.esPropietario) {
      console.warn('⚠️ Usuario no autorizado para agregar publicaciones');
      return;
    }

    this.mostrarPublicacionesModal = true;
    this.publicacionesSeleccionadas = [];
    this.mensajeExito = '';
    this.mensajeError = '';
    this.cargarPublicaciones();
  }

  cerrarPublicacionesModal(): void {
    this.mostrarPublicacionesModal = false;
    this.publicacionesSeleccionadas = [];
    this.mensajeExito = '';
    this.mensajeError = '';
  }

  cargarPublicaciones(): void {
    this.cargandoPublicaciones = true;
    this.publicaciones = [];
    this.errorCargaPublicaciones = '';

    this.publicacionesService.obtenerMisPublicaciones().subscribe({
      next: (response) => {
        if (response.success) {
          this.publicaciones = response.data;
        } else {
          this.errorCargaPublicaciones = response.message || 'No se pudieron cargar tus publicaciones';
        }
        this.cargandoPublicaciones = false;
      },
      error: (error) => {
        this.errorCargaPublicaciones = 'Error al cargar tus publicaciones';
        this.cargandoPublicaciones = false;
      }
    });
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
    if (!this.esPropietario) {
      this.mensajeError = 'No tienes permiso para agregar publicaciones';
      return;
    }

    if (!this.selectedSection || this.publicacionesSeleccionadas.length === 0) {
      this.mensajeError = 'Debes seleccionar al menos una publicación';
      return;
    }

    this.agregandoPublicaciones = true;
    this.mensajeError = '';
    this.mensajeExito = '';

    const requests = this.publicacionesSeleccionadas.map(publicacionId =>
      this.seccionesService.agregarPostASeccion({
        seccion_id: this.selectedSection!.id,
        publicacion_id: publicacionId
      })
    );

    forkJoin(requests).subscribe({
      next: (resultados) => {
        const exitosos = resultados.filter(r => r.success).length;
        const fallidos = resultados.length - exitosos;

        this.agregandoPublicaciones = false;

        if (exitosos > 0 && fallidos === 0) {
          this.mensajeExito = `✅ ${exitosos} publicación${exitosos > 1 ? 'es' : ''} agregada${exitosos > 1 ? 's' : ''} exitosamente`;

          if (this.selectedSection) {
            this.selectedSection.total_posts += exitosos;
          }

          setTimeout(() => {
            this.cerrarPublicacionesModal();
            this.sectionUpdated.emit();
            if (this.selectedSection) {
              this.cargarPostsDeSeccion(this.selectedSection.id);
            }
          }, 2000);
        } else if (exitosos > 0 && fallidos > 0) {
          this.mensajeError = `⚠️ Se agregaron ${exitosos} publicación(es), pero ${fallidos} fallaron`;
        } else {
          this.mensajeError = '❌ No se pudo agregar ninguna publicación';
        }
      },
      error: (error) => {
        this.agregandoPublicaciones = false;
        this.mensajeError = '❌ Error al agregar publicaciones';
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
      return `${environment.socketUrl}${publicacion.foto_perfil_url}`;
    }
    const nombre = publicacion.nombre_completo || publicacion.nombre_usuario || 'Usuario';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=random&color=fff`;
  }

  obtenerImagenUrl(imagenUrl: string): string {
    if (!imagenUrl) return '';
    if (imagenUrl.startsWith('http')) {
      return imagenUrl;
    }
    return `${environment.socketUrl}${imagenUrl}`;
  }

  obtenerNombreAutor(publicacion: Publicacion): string {
    return publicacion.nombre_completo || publicacion.nombre_usuario || 'Usuario Anónimo';
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