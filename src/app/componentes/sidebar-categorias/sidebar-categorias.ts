import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { PublicacionesService } from '../../core/servicios/publicaciones/publicaciones';

interface Categoria {
  nombre: string;
  icon: string;
  color: string;
  filtro: string;
}

@Component({
  selector: 'app-sidebar-categorias',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar-categorias.html',
  styleUrls: ['./sidebar-categorias.css']
})
export class SidebarCategorias implements OnInit, OnDestroy {
  @Input() categorias: Categoria[] = [];
  @Input() categoriaSeleccionada: string | null = null;
  @Input() cardBg: string = '';
  @Input() textPrimaryClass: string = '';
  @Input() textSecondaryClass: string = '';
  @Input() accentBg: string = '';
  @Input() hoverBackground: string = '';
  
  @Output() seleccionarCategoria = new EventEmitter<string>();

  // Estado de carga
  cargandoContadores = false;

  // ========== MISMO MAPEO DE COLORES QUE EXPLORAR ==========
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

  // Tags con contadores (misma estructura que Explorar)
  tags: Categoria[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private publicacionesService: PublicacionesService
  ) {}

  ngOnInit(): void {
    // Inicializar tags con las categorías recibidas
    this.tags = [...this.categorias];
    this.cargarPublicaciones();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Cargar publicaciones y actualizar contadores
   * (MISMA LÓGICA QUE EXPLORAR)
   */
  private cargarPublicaciones(): void {
    this.cargandoContadores = true;

    this.publicacionesService.obtenerPublicaciones()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && Array.isArray(response.data)) {
            // Actualizar contadores usando la misma lógica de Explorar
            this.actualizarContadorTags(response.data);
          }
          this.cargandoContadores = false;
        },
        error: (error) => {
          this.cargandoContadores = false;
        }
      });
  }

  /**
   * Actualizar contadores de tags
   * (EXACTAMENTE IGUAL QUE EN EXPLORAR)
   */
  private actualizarContadorTags(publicaciones: any[]): void {
    this.tags = this.tags.map(tag => {
      const cantidad = publicaciones.filter(p => {
        const categoria = p.categoria || 'General';
        return categoria.toLowerCase() === tag.nombre.toLowerCase();
      }).length;
      
      return { ...tag, posts: cantidad } as any;
    });
  }

  /**
   * Obtener contador de una categoría
   */
  obtenerContador(categoria: string): number {
    const tag = this.tags.find(t => 
      t.nombre.toLowerCase() === categoria.toLowerCase()
    );
    return (tag as any)?.posts || 0;
  }

  /**
   * Seleccionar categoría (toggle on/off)
   * (MISMA LÓGICA QUE EXPLORAR)
   */
  seleccionar(categoria: string): void {
    // Toggle: si es la misma categoría, deseleccionar
    const nuevaSeleccion = this.categoriaSeleccionada === categoria ? null : categoria;
    
    this.seleccionarCategoria.emit(categoria);
  }

  /**
   * Obtener color base de una categoría
   * (MISMO MÉTODO QUE EXPLORAR)
   */
  getColor(color: string): string {
    return this.colorMap[color] || '#6b7280';
  }

  /**
   * Obtener color más oscuro
   * (MISMO MÉTODO QUE EXPLORAR)
   */
  getDarkerColor(color: string): string {
    return this.darkerColorMap[color] || '#4b5563';
  }

  /**
   * Obtener gradiente de color
   * (MISMO MÉTODO QUE EXPLORAR)
   */
  getGradient(color: string): string {
    const baseColor = this.colorMap[color];
    const darkerColor = this.darkerColorMap[color];
    return `linear-gradient(to bottom right, ${baseColor}, ${darkerColor})`;
  }
}

// Extender interface para incluir posts
interface CategoriaConContador extends Categoria {
  posts?: number;
}