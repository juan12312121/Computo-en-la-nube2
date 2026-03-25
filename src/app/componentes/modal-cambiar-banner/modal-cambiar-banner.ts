import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Usuario } from '../../core/modelos/usuario.model';
import { Theme } from '../../core/servicios/temas';
import { environment } from '../../../environments/environment';
import * as Utils from '../../core/utilidades/formateadores';

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
  @Input() s3BaseUrl = environment.socketUrl;

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
    return Utils.normalizarUrlImagen(this.usuario.foto_portada_url, this.s3BaseUrl, 'portadas');
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.errorBanner = 'Por favor selecciona una imagen válida';
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      this.errorBanner = 'La imagen no debe superar los 10MB';
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