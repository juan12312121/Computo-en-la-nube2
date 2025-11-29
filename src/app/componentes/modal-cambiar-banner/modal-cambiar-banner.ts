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
  @Input() s3BaseUrl = 'https://redstudent-uploads.s3.us-east-2.amazonaws.com';

  @Output() close = new EventEmitter<void>();
  @Output() guardar = new EventEmitter<File>();

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
    
    if (this.usuario.foto_portada_url.startsWith('http://') || 
        this.usuario.foto_portada_url.startsWith('https://')) {
      return this.usuario.foto_portada_url;
    }
    
    return `${this.s3BaseUrl}/${this.usuario.foto_portada_url.replace(/^\/+/, '')}`;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      this.errorBanner = 'Por favor selecciona una imagen válida';
      return;
    }
    
    const maxSize = 5 * 1024 * 1024;
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
  }

  onGuardar(): void {
    if (!this.archivoBanner) {
      this.errorBanner = 'Por favor selecciona una imagen';
      return;
    }
    
    this.guardar.emit(this.archivoBanner);
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