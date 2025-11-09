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
  @Input() s3BaseUrl = 'https://redstudent-uploads.s3.us-east-2.amazonaws.com'; // 🆕 URL de S3
  
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

    if (this.tipo === 'seguidores') {
      this.seguidorService.listarSeguidores(this.usuarioId).subscribe({
        next: (response) => {
          console.log('📦 Respuesta seguidores recibida:', response);
          
          if (response.success && response.data) {
            this.usuarios = response.data.seguidores || [];
            this.total = response.data.total || 0;
            
            console.log('✅ Seguidores procesados:', {
              total: this.total,
              usuarios: this.usuarios.length,
              lista: this.usuarios
            });
          } else {
            console.warn('⚠️ Respuesta sin seguidores:', response);
            this.usuarios = [];
            this.total = 0;
          }
          
          this.cargando = false;
        },
        error: (error: any) => {
          console.error('❌ Error al cargar seguidores:', error);
          this.error = error.error?.mensaje || error.error?.message || 'No se pudo cargar la lista de seguidores';
          this.usuarios = [];
          this.total = 0;
          this.cargando = false;
        }
      });
    } else {
      this.seguidorService.listarSeguidos(this.usuarioId).subscribe({
        next: (response) => {
          console.log('📦 Respuesta seguidos recibida:', response);
          
          if (response.success && response.data) {
            this.usuarios = response.data.seguidos || [];
            this.total = response.data.total || 0;
            
            console.log('✅ Seguidos procesados:', {
              total: this.total,
              usuarios: this.usuarios.length,
              lista: this.usuarios
            });
          } else {
            console.warn('⚠️ Respuesta sin seguidos:', response);
            this.usuarios = [];
            this.total = 0;
          }
          
          this.cargando = false;
        },
        error: (error: any) => {
          console.error('❌ Error al cargar seguidos:', error);
          this.error = error.error?.mensaje || error.error?.message || 'No se pudo cargar la lista de seguidos';
          this.usuarios = [];
          this.total = 0;
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

  // 🆕 Método actualizado para usar S3
  getProfileImage(usuario: UsuarioSeguidor): string {
    if (!usuario.foto_perfil_url) {
      return '';
    }
    
    // Si ya es URL completa, retornarla
    if (usuario.foto_perfil_url.startsWith('http://') || 
        usuario.foto_perfil_url.startsWith('https://')) {
      return usuario.foto_perfil_url;
    }
    
    // Construir URL de S3
    return `${this.s3BaseUrl}/${usuario.foto_perfil_url.replace(/^\/+/, '')}`;
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