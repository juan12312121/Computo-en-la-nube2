import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { FotosService } from '../../core/servicios/fotos/fotos';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

interface UsuarioConFoto {
  id: number;
  nombre_completo: string;
  nombre_usuario: string;
  foto_perfil_url: string | null;
}

@Component({
  selector: 'app-sidebar-usuarios-activos',
  imports: [CommonModule],
  templateUrl: './sidebar-usuarios-activos.html',
  styleUrl: './sidebar-usuarios-activos.css'
})
export class SidebarUsuariosActivos implements OnInit, OnChanges {
  @Input() usuarios: any[] = [];
  @Input() cardBg: string = '';
  @Input() textPrimaryClass: string = '';
  @Input() textSecondaryClass: string = '';
  @Input() accentBg: string = '';
  @Input() hoverBackground: string = '';
  @Input() borderClass: string = '';

  usuariosConFotos: UsuarioConFoto[] = [];
  cargandoFotos: boolean = false;

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
    private fotosService: FotosService
  ) {}

  ngOnInit(): void {
    this.cargarFotosUsuarios();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Recargar fotos cuando cambie el input de usuarios
    if (changes['usuarios'] && !changes['usuarios'].firstChange) {
      this.cargarFotosUsuarios();
    }
  }

  /**
   * Carga las fotos de perfil de todos los usuarios activos
   * Usa el método batch para optimizar las peticiones
   */
  private cargarFotosUsuarios(): void {
    if (!this.usuarios || this.usuarios.length === 0) {
      this.usuariosConFotos = [];
      return;
    }

    this.cargandoFotos = true;

    // Extraer IDs de usuarios
    const usuariosIds = this.usuarios.map(u => u.id);

    // Usar el método batch para obtener todas las fotos en una sola petición
    this.fotosService.obtenerFotosBatch(usuariosIds).pipe(
      map(response => {
        if (response.success && response.data) {
          // Crear un mapa para acceso rápido por ID
          const fotosMap = new Map(
            response.data.map(u => [u.id, u.foto_perfil_url])
          );

          // Combinar datos originales con las fotos
          return this.usuarios.map(usuario => ({
            id: usuario.id,
            nombre_completo: usuario.nombre_completo,
            nombre_usuario: usuario.nombre_usuario,
            foto_perfil_url: fotosMap.get(usuario.id) || null
          }));
        }
        return [];
      }),
      catchError(error => {
        // En caso de error, devolver usuarios sin fotos
        return of(this.usuarios.map(u => ({
          id: u.id,
          nombre_completo: u.nombre_completo,
          nombre_usuario: u.nombre_usuario,
          foto_perfil_url: null
        })));
      })
    ).subscribe({
      next: (usuariosConFotos) => {
        this.usuariosConFotos = usuariosConFotos;
        this.cargandoFotos = false;
      },
      error: (error) => {
        this.cargandoFotos = false;
      }
    });
  }

  /**
   * Método alternativo: carga individual (usar solo si batch falla)
   * Mantener comentado a menos que se necesite
   */
  private cargarFotosIndividualmente(): void {
    if (!this.usuarios || this.usuarios.length === 0) {
      this.usuariosConFotos = [];
      return;
    }

    this.cargandoFotos = true;

    // Crear array de observables para peticiones paralelas
    const peticiones = this.usuarios.map(usuario =>
      this.fotosService.obtenerFotoPerfil(usuario.id).pipe(
        map(response => ({
          id: usuario.id,
          nombre_completo: usuario.nombre_completo,
          nombre_usuario: usuario.nombre_usuario,
          foto_perfil_url: response.success ? response.data.foto_perfil_url : null
        })),
        catchError(error => {
          return of({
            id: usuario.id,
            nombre_completo: usuario.nombre_completo,
            nombre_usuario: usuario.nombre_usuario,
            foto_perfil_url: null
          });
        })
      )
    );

    // Ejecutar todas las peticiones en paralelo
    forkJoin(peticiones).subscribe({
      next: (usuariosConFotos) => {
        this.usuariosConFotos = usuariosConFotos;
        this.cargandoFotos = false;
      },
      error: (error) => {
        this.cargandoFotos = false;
      }
    });
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
}