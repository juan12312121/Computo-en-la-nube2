import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { SeguidorService } from '../../core/servicios/seguidores/seguidores';

@Component({
  selector: 'app-app-sidebar-sugerencias',
  imports: [CommonModule],
  templateUrl: './app-sidebar-sugerencias.html',
  styleUrl: './app-sidebar-sugerencias.css'
})
export class AppSidebarSugerencias implements OnInit, OnDestroy {
  @Input() usuarioActualId: number | null = null;
  @Input() seguidosIds: Set<number> = new Set();
  @Input() cardBg: string = '';
  @Input() textPrimaryClass: string = '';
  @Input() textSecondaryClass: string = '';
  @Input() accentBg: string = '';
  @Input() hoverBackground: string = '';
  
  @Output() seguirUsuario = new EventEmitter<number>();
  @Output() sugerenciasCargadas = new EventEmitter<number>();

  usuarios: any[] = [];
  isLoading: boolean = false;
  private destroy$ = new Subject<void>();

  private readonly AVATAR_COLORS = [
    'linear-gradient(to bottom right, #2dd4bf, #0d9488)',
    'linear-gradient(to bottom right, #f97316, #ea580c)',
    'linear-gradient(to bottom right, #a855f7, #9333ea)',
    'linear-gradient(to bottom right, #ec4899, #db2777)',
    'linear-gradient(to bottom right, #6366f1, #8b5cf6)',
    'linear-gradient(to bottom right, #3b82f6, #2563eb)',
    'linear-gradient(to bottom right, #10b981, #059669)',
    'linear-gradient(to bottom right, #fbbf24, #f59e0b)'
  ];

  constructor(
    private router: Router,
    private seguidorService: SeguidorService
  ) {}

  ngOnInit(): void {
    this.cargarSugerencias();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga usuarios sugeridos basados en seguidores de tus seguidos
   */
  private cargarSugerencias(): void {
    if (!this.usuarioActualId) {
      this.usuarios = [];
      return;
    }

    this.isLoading = true;

    // Obtener usuarios que YO sigo
    this.seguidorService.listarSeguidos(this.usuarioActualId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (!response.success || !response.data?.seguidos || response.data.seguidos.length === 0) {
            this.usuarios = [];
            this.isLoading = false;
            this.sugerenciasCargadas.emit(0);
            return;
          }

          const misSeguidos = response.data.seguidos;

          // Obtener seguidores de mis seguidos
          this.obtenerSeguidoresDeSeguidores(misSeguidos);
        },
        error: (error) => {
          this.usuarios = [];
          this.isLoading = false;
          this.sugerenciasCargadas.emit(0);
        }
      });
  }

  /**
   * Obtiene los seguidores de cada usuario que sigo
   */
  private obtenerSeguidoresDeSeguidores(misSeguidos: any[]): void {
    const sugerenciasMap = new Map<number, any>();
    let procesados = 0;
    const total = Math.min(misSeguidos.length, 5);

    const seguidosAConsultar = misSeguidos.slice(0, 5);

    seguidosAConsultar.forEach((seguido) => {
      this.seguidorService.listarSeguidores(seguido.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            procesados++;

            if (response.success && response.data?.seguidores) {
              response.data.seguidores.forEach((seguidor: any) => {
                // Filtrar: no yo mismo, no los que ya sigo, no duplicados
                if (
                  seguidor.id !== this.usuarioActualId &&
                  !this.seguidosIds.has(seguidor.id) &&
                  !sugerenciasMap.has(seguidor.id)
                ) {
                  sugerenciasMap.set(seguidor.id, {
                    ...seguidor,
                    razon: `Sigue a ${seguido.nombre_completo || seguido.nombre_usuario}`
                  });
                }
              });
            }

            if (procesados === total) {
              this.finalizarSugerencias(sugerenciasMap);
            }
          },
          error: (error) => {
            procesados++;

            if (procesados === total) {
              this.finalizarSugerencias(sugerenciasMap);
            }
          }
        });
    });
  }

  /**
   * Finaliza y ordena las sugerencias
   */
  private finalizarSugerencias(sugerenciasMap: Map<number, any>): void {
    if (sugerenciasMap.size === 0) {
      this.usuarios = [];
      this.isLoading = false;
      this.sugerenciasCargadas.emit(0);
      return;
    }

    // Convertir a array y limitar a 5
    this.usuarios = Array.from(sugerenciasMap.values())
      .slice(0, 5)
      .map(usuario => ({
        id: usuario.id,
        nombre_usuario: usuario.nombre_usuario,
        nombre_completo: usuario.nombre_completo,
        foto_perfil_url: usuario.foto_perfil_url || null,
        carrera: usuario.carrera || 'Sin carrera',
        total_seguidores: usuario.total_seguidores || 0,
        razon: usuario.razon
      }));

    this.isLoading = false;
    this.sugerenciasCargadas.emit(this.usuarios.length);
  }

  /**
   * Recarga sugerencias (útil después de seguir a alguien)
   */
  public recargarSugerencias(): void {
    this.cargarSugerencias();
  }

  obtenerIniciales(nombre: string): string {
    if (!nombre) return 'U';
    const palabras = nombre.trim().split(' ');
    return palabras.length >= 2
      ? (palabras[0][0] + palabras[1][0]).toUpperCase()
      : nombre.substring(0, 2).toUpperCase();
  }

  generarColorAvatar(id: number): string {
    return this.AVATAR_COLORS[id % this.AVATAR_COLORS.length];
  }

  irAPerfil(usuarioId: number): void {
    this.router.navigate(['/perfil', usuarioId]);
  }

  onSeguirUsuario(usuarioId: number): void {
    this.seguirUsuario.emit(usuarioId);
  }
}