import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Usuario } from '../../core/servicios/autenticacion/autenticacion';
import { Theme } from '../../core/servicios/temas';

@Component({
  selector: 'app-modal-cambiar-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-cambiar-banner.html',
  styleUrl: './modal-cambiar-banner.css'
})
export class ModalCambiarBanner {
  @Input() isVisible = false;
  @Input() usuario: Usuario | null = null;
  @Input() currentTheme!: Theme;
  @Input() guardando = false;
  @Input() errorBanner = '';
  @Input() apiBaseUrl = '';

  @Output() close = new EventEmitter<void>();
  @Output() guardar = new EventEmitter<File>();
  @Output() eliminar = new EventEmitter<void>();

  archivoBanner: File | null = null;
  previsualizacionBanner: string | null = null;

  ngOnChanges() {
    if (this.isVisible) {
      this.inicializar();
    }
  }

  inicializar(): void {
    this.archivoBanner = null;
    this.previsualizacionBanner = null;
  }

  getCoverImage(): string | null {
    if (!this.usuario?.foto_portada_url) return null;
    
    if (this.usuario.foto_portada_url.startsWith('http')) {
      return this.usuario.foto_portada_url;
    }
    
    return `${this.apiBaseUrl}${this.usuario.foto_portada_url}`;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      this.errorBanner = 'Por favor selecciona una imagen válida';
      return;
    }
    
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      this.errorBanner = 'La imagen no debe superar los 5MB';
      return;
    }
    
    this.errorBanner = '';
    this.archivoBanner = file;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      this.previsualizacionBanner = e.target?.result as string;
    };
    reader.readAsDataURL(file);
    
    console.log('🖼️ Banner seleccionado:', {
      nombre: file.name,
      tipo: file.type,
      tamaño: file.size
    });
  }

  onGuardar(): void {
    if (!this.archivoBanner) {
      this.errorBanner = 'Por favor selecciona una imagen';
      return;
    }
    
    this.guardar.emit(this.archivoBanner);
  }

  onEliminar(): void {
    if (!confirm('¿Estás seguro de que deseas eliminar tu foto de portada?')) {
      return;
    }
    
    this.eliminar.emit();
  }

  onCerrar(): void {
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.onCerrar();
    }
  }
}