import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { PublicacionesService } from '../../core/servicios/publicaciones/publicaciones';
import { SeguidorService } from '../../core/servicios/seguidores/seguidores';
import { Usuario } from '../../core/modelos/usuario.model';
import { environment } from '../../../environments/environment';
import * as Utils from '../../core/utilidades/formateadores';

@Component({
  selector: 'app-sidebar-perfil',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar-perfil.html',
  styleUrls: ['./sidebar-perfil.css']
})
export class SidebarPerfil implements OnInit, OnDestroy {
  // Datos del usuario
  @Input() usuario: Usuario | null = null;

  // Clases de estilo
  @Input() cardBg: string = '';
  @Input() textPrimaryClass: string = '';
  @Input() textSecondaryClass: string = '';
  @Input() borderColor: string = '';
  @Input() accentBg: string = '';
  @Input() borderClass: string = '';

  // Evento para navegar al perfil (opcional, ahora usamos Router directamente)
  @Output() navegarPerfil = new EventEmitter<void>();

  // Contadores (manejados internamente)
  totalPosts: number = 0;
  totalSeguidores: number = 0;
  totalSiguiendo: number = 0;

  // Estado de carga
  cargandoEstadisticas: boolean = false;

  private readonly BASE_URL = environment.socketUrl;

  private destroy$ = new Subject<void>();

  constructor(
    private publicacionesService: PublicacionesService,
    private seguidorService: SeguidorService,
    private router: Router
  ) {
    console.log('👤 SidebarPerfil inicializado con BASE_URL:', this.BASE_URL);
  }

  ngOnInit(): void {
    if (this.usuario?.id) {
      console.log('📊 Cargando estadísticas para usuario:', this.usuario.id);
      this.cargarEstadisticas();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * ✅ NUEVA: Construir URL local para foto de perfil
   */
  obtenerUrlFotoPerfil(): string | null {
    if (!this.usuario?.foto_perfil_url) return null;
    return Utils.normalizarUrlImagen(this.usuario.foto_perfil_url, this.BASE_URL, 'perfiles');
  }

  /**
   * ✅ NUEVA: Construir URL local para foto de portada
   */
  obtenerUrlFotoPortada(): string | null {
    if (!this.usuario?.foto_portada_url) return null;
    return Utils.normalizarUrlImagen(this.usuario.foto_portada_url, this.BASE_URL, 'portadas');
  }

  /**
   * ✅ MEJORADA: Verificar si el usuario tiene foto de perfil
   */
  tieneFotoPerfil(): boolean {
    return this.obtenerUrlFotoPerfil() !== null;
  }

  /**
   * ✅ NUEVA: Verificar si el usuario tiene foto de portada
   */
  tieneFotoPortada(): boolean {
    return this.obtenerUrlFotoPortada() !== null;
  }

  /**
   * Cargar todas las estadísticas del usuario
   */
  private cargarEstadisticas(): void {
    this.cargandoEstadisticas = true;

    // Cargar estadísticas en paralelo
    this.cargarTotalPosts();
    this.cargarEstadisticasSeguidores();
  }

  /**
   * Cargar total de publicaciones
   */
  private cargarTotalPosts(): void {
    this.publicacionesService.obtenerMisPublicaciones()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && Array.isArray(response.data)) {
            this.totalPosts = response.data.length;
            console.log('📝 Total posts:', this.totalPosts);
          } else {
            this.totalPosts = 0;
          }
        },
        error: (error) => {
          console.error('❌ Error al cargar posts:', error);
          this.totalPosts = 0;
        }
      });
  }

  /**
   * Cargar estadísticas de seguidores y seguidos
   */
  private cargarEstadisticasSeguidores(): void {
    if (!this.usuario?.id) return;

    this.seguidorService.obtenerEstadisticas(this.usuario.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.totalSeguidores = response.data.seguidores || 0;
            this.totalSiguiendo = response.data.seguidos || 0;
            console.log('👥 Seguidores/Siguiendo:', {
              seguidores: this.totalSeguidores,
              siguiendo: this.totalSiguiendo
            });
          } else {
            this.totalSeguidores = 0;
            this.totalSiguiendo = 0;
          }
          this.cargandoEstadisticas = false;
        },
        error: (error) => {
          console.error('❌ Error al cargar estadísticas de seguidores:', error);
          this.totalSeguidores = 0;
          this.totalSiguiendo = 0;
          this.cargandoEstadisticas = false;
        }
      });
  }

  /**
   * Obtiene las iniciales del nombre del usuario
   */
  obtenerIniciales(nombre: string): string {
    if (!nombre) return 'U';
    const palabras = nombre.trim().split(' ');
    return palabras.length >= 2
      ? (palabras[0][0] + palabras[1][0]).toUpperCase()
      : nombre.substring(0, 2).toUpperCase();
  }

  /**
   * Navegar al perfil del usuario actual
   */
  irAPerfil(event?: Event): void {
    // Prevenir propagación si es necesario
    if (event) {
      event.stopPropagation();
    }

    // Emitir evento (por si el padre necesita hacer algo)
    this.navegarPerfil.emit();

    // Navegar a la ruta del perfil
    if (this.usuario?.id) {
      console.log('🚀 Navegando a perfil del usuario:', this.usuario.id);
      this.router.navigate(['/perfil', this.usuario.id]);
    } else {
      // Si no hay ID, ir a /perfil sin parámetro
      console.log('🚀 Navegando a perfil sin ID');
      this.router.navigate(['/perfil']);
    }
  }

  /**
   * ✅ NUEVA: Manejar error de carga de imagen
   */
  onImageError(event: Event): void {
    console.warn('⚠️ Error al cargar foto de perfil, usando iniciales');
    // La plantilla HTML debería mostrar las iniciales cuando esto ocurra
  }
}
