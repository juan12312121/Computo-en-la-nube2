import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Theme } from '../../core/servicios/temas';

export interface UsuarioPerfil {
  id: number;
  nombre_completo: string;
  nombre_usuario: string;
  biografia?: string;
  carrera?: string;
  ubicacion?: string;
  foto_perfil_url?: string;
  foto_portada_url?: string;
  total_seguidores?: number;
  total_siguiendo?: number;
}

@Component({
  selector: 'app-profile-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-header.html',
  styleUrls: ['./profile-header.css'],
})
export class ProfileHeaderComponent {
  @Input() usuario!: UsuarioPerfil;
  @Input() currentTheme!: Theme;
  @Input() isOwnProfile: boolean = false;
  @Input() estaSiguiendo: boolean = false;
  @Input() cargandoAccion: boolean = false;
  @Input() profileImage: string | null = null;
  @Input() coverImage: string | null = null;
  @Input() iniciales: string = '??';
  @Input() totalPublicaciones: number = 0;
  @Input() totalSeguidores: number = 0;
  @Input() totalSiguiendo: number = 0;
  @Input() textoBoton: string = '';
  @Input() iconoBoton: string = '';

  @Output() cambiarBanner = new EventEmitter<void>();
  @Output() accionBoton = new EventEmitter<void>();
  @Output() abrirSeguidores = new EventEmitter<void>();
  @Output() abrirSiguiendo = new EventEmitter<void>();

  getButtonClass(): string {
    if (this.isOwnProfile) {
      return 'profile-action-btn edit';
    }
    return 'profile-action-btn ' + (this.estaSiguiendo ? 'following' : 'follow');
  }
}