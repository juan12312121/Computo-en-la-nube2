import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sidebar-usuarios-activos',
  imports: [CommonModule],
  templateUrl: './sidebar-usuarios-activos.html',
  styleUrl: './sidebar-usuarios-activos.css'
})
export class SidebarUsuariosActivos {
  @Input() usuarios: any[] = [];
  @Input() cardBg: string = '';
  @Input() textPrimaryClass: string = '';
  @Input() textSecondaryClass: string = '';
  @Input() accentBg: string = '';
  @Input() hoverBackground: string = '';
  @Input() borderClass: string = '';

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

  constructor(private router: Router) {}

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