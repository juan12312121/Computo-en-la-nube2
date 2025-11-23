import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Usuario } from '../../core/servicios/autenticacion/autenticacion';
import { Theme } from '../../core/servicios/temas';

export interface FormularioEditarPerfil {
  nombre_completo: string;
  biografia: string;
  ubicacion: string;
  carrera: string;
}

@Component({
  selector: 'app-modal-editar-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-editar-perfil.html',
  styleUrl: './modal-editar-perfil.css'
})
export class ModalEditarPerfil {
  @Input() isVisible = false;
  @Input() usuario: Usuario | null = null;
  @Input() currentTheme!: Theme;
  @Input() guardando = false;
  @Input() errorGuardado = false;
  @Input() mensajeError = '';
  @Input() s3BaseUrl = 'https://redstudent-uploads.s3.us-east-2.amazonaws.com';

  @Output() close = new EventEmitter<void>();
  @Output() guardar = new EventEmitter<{
    formulario: FormularioEditarPerfil;
    archivo: File | null;
  }>();

  formulario: FormularioEditarPerfil = {
    nombre_completo: '',
    biografia: '',
    ubicacion: '',
    carrera: ''
  };

  archivoFoto: File | null = null;
  previsualizacionFoto: string | null = null;
  errorFoto: string = '';

  ngOnChanges() {
    if (this.isVisible && this.usuario) {
      this.inicializarFormulario();
    }
  }

  inicializarFormulario(): void {
    if (!this.usuario) return;

    this.formulario = {
      nombre_completo: this.usuario.nombre_completo || '',
      biografia: this.usuario.biografia || '',
      ubicacion: this.usuario.ubicacion || '',
      carrera: this.usuario.carrera || ''
    };

    this.archivoFoto = null;
    this.previsualizacionFoto = null;
    this.errorFoto = '';
  }

  getInitials(): string {
    if (!this.usuario?.nombre_completo) return '??';
    
    const names = this.usuario.nombre_completo.trim().split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return names[0].substring(0, 2).toUpperCase();
  }

  getProfileImage(): string | null {
    if (!this.usuario?.foto_perfil_url) return null;
    
    if (this.usuario.foto_perfil_url.startsWith('http://') || 
        this.usuario.foto_perfil_url.startsWith('https://')) {
      return this.usuario.foto_perfil_url;
    }
    
    return `${this.s3BaseUrl}/${this.usuario.foto_perfil_url.replace(/^\/+/, '')}`;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      this.errorFoto = 'Por favor selecciona una imagen válida';
      return;
    }
    
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      this.errorFoto = 'La imagen no debe superar los 5MB';
      return;
    }
    
    this.errorFoto = '';
    this.archivoFoto = file;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      this.previsualizacionFoto = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  onGuardar(): void {
    this.guardar.emit({
      formulario: this.formulario,
      archivo: this.archivoFoto
    });
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