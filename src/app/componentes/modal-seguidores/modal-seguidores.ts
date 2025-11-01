import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { SeguidorService, UsuarioSeguidor } from '../../core/servicios/seguidores/seguidores';
import { Theme } from '../../core/servicios/temas';

export type TipoModal = 'seguidores' | 'seguidos';

@Component({
  selector: 'app-modal-seguidores',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-seguidores.html',
  styleUrl: './modal-seguidores.css'
})
export class ModalSeguidores implements OnChanges {
  @Input() isVisible = false;
  @Input() tipo: TipoModal = 'seguidores';
  @Input() usuarioId: number | null = null;
  @Input() currentTheme!: Theme;
  @Input() apiBaseUrl = '';
  
  @Output() close = new EventEmitter<void>();

  usuarios: UsuarioSeguidor[] = [];
  cargando = false;
  error = '';
  total = 0;

  constructor(
    private seguidorService: SeguidorService,
    private router: Router
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isVisible'] && this.isVisible && this.usuarioId) {
      this.cargarDatos();
    }
  }

  cargarDatos(): void {
    if (!this.usuarioId) {
      console.error('❌ No hay usuarioId para cargar datos');
      return;
    }

    console.log('🔄 Cargando datos:', {
      tipo: this.tipo,
      usuarioId: this.usuarioId
    });

    this.cargando = true;
    this.error = '';
    this.usuarios = [];

    // Separar las llamadas para evitar problemas de tipos
    if (this.tipo === 'seguidores') {
      this.seguidorService.listarSeguidores(this.usuarioId).subscribe({
        next: (response) => {
          console.log('📦 Respuesta seguidores recibida:', response);
          
          this.usuarios = response.seguidores || [];
          this.total = response.total || 0;
          
          console.log('✅ Seguidores procesados:', {
            total: this.total,
            usuarios: this.usuarios.length,
            lista: this.usuarios
          });
          
          this.cargando = false;
        },
        error: (error: any) => {
          console.error('❌ Error al cargar seguidores:', error);
          console.error('📋 Detalles del error:', {
            status: error.status,
            statusText: error.statusText,
            message: error.message,
            error: error.error
          });
          
          this.error = error.error?.mensaje || error.error?.message || 'No se pudo cargar la lista de seguidores';
          this.cargando = false;
        }
      });
    } else {
      this.seguidorService.listarSeguidos(this.usuarioId).subscribe({
        next: (response) => {
          console.log('📦 Respuesta seguidos recibida:', response);
          
          this.usuarios = response.seguidos || [];
          this.total = response.total || 0;
          
          console.log('✅ Seguidos procesados:', {
            total: this.total,
            usuarios: this.usuarios.length,
            lista: this.usuarios
          });
          
          this.cargando = false;
        },
        error: (error: any) => {
          console.error('❌ Error al cargar seguidos:', error);
          console.error('📋 Detalles del error:', {
            status: error.status,
            statusText: error.statusText,
            message: error.message,
            error: error.error
          });
          
          this.error = error.error?.mensaje || error.error?.message || 'No se pudo cargar la lista de seguidos';
          this.cargando = false;
        }
      });
    }
  }

  cerrarModal(): void {
    this.close.emit();
  }

  verPerfil(usuarioId: number): void {
    this.cerrarModal();
    this.router.navigate(['/perfil', usuarioId]);
  }

  getProfileImage(usuario: UsuarioSeguidor): string {
    if (!usuario.foto_perfil_url) {
      return '';
    }
    
    if (usuario.foto_perfil_url.startsWith('http')) {
      return usuario.foto_perfil_url;
    }
    
    return `${this.apiBaseUrl}${usuario.foto_perfil_url}`;
  }

  getInitials(usuario: UsuarioSeguidor): string {
    const names = usuario.nombre_completo.trim().split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return names[0].substring(0, 2).toUpperCase();
  }

  getTitulo(): string {
    return this.tipo === 'seguidores' ? 'Seguidores' : 'Siguiendo';
  }
}