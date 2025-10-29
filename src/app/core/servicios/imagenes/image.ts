import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

/**
 * 🖼️ Servicio para gestionar URLs de imágenes
 * Centraliza la lógica de construcción de URLs para imágenes del backend
 */
@Injectable({
  providedIn: 'root'
})
export class ImageService {
  private apiBaseUrl: string;

  constructor(private http: HttpClient) {
    this.apiBaseUrl = this.detectApiUrl();
  }

  /**
   * Detecta la URL base de la API según el entorno
   */
  private detectApiUrl(): string {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:3000';
    } else {
      return 'http://13.59.190.199:3000';
    }
  }

  /**
   * 🖼️ Obtiene la URL completa de una imagen de perfil
   */
  getProfileImageUrl(fotoUrl: string | null | undefined): string | null {
    return this.buildImageUrl(fotoUrl);
  }

  /**
   * 🖼️ Obtiene la URL completa de una imagen de portada
   */
  getCoverImageUrl(fotoUrl: string | null | undefined): string | null {
    return this.buildImageUrl(fotoUrl);
  }

  /**
   * 🖼️ Obtiene la URL completa de cualquier imagen del sistema
   */
  getImageUrl(imagePath: string | null | undefined): string | null {
    return this.buildImageUrl(imagePath);
  }

  /**
   * 🛠️ Construye la URL completa de una imagen
   */
  private buildImageUrl(imagePath: string | null | undefined): string | null {
    if (!imagePath || imagePath.trim() === '') {
      return null;
    }

    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${this.apiBaseUrl}${normalizedPath}`;
  }

  /**
   * 🎨 Genera las iniciales de un nombre para avatares
   */
  getInitials(nombreCompleto: string | null | undefined): string {
    if (!nombreCompleto || nombreCompleto.trim() === '') {
      return '??';
    }

    const names = nombreCompleto.trim().split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return names[0].substring(0, 2).toUpperCase();
  }

  /**
   * 📏 Valida si un archivo es una imagen válida
   */
  validateImageFile(file: File): { valid: boolean; error?: string } {
    if (!file.type.startsWith('image/')) {
      return { 
        valid: false, 
        error: 'Por favor selecciona una imagen válida (JPG, PNG, GIF, etc.)' 
      };
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return { 
        valid: false, 
        error: 'La imagen no debe superar los 5MB' 
      };
    }

    return { valid: true };
  }

  /**
   * 🔄 Crea una URL de previsualización para una imagen
   */
  createPreviewUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string);
        } else {
          reject(new Error('No se pudo crear la previsualización'));
        }
      };
      reader.onerror = () => {
        reject(new Error('Error al leer el archivo'));
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * 🎯 Obtiene la URL base de la API
   */
  getApiBaseUrl(): string {
    return this.apiBaseUrl;
  }

  /**
   * 🔧 Actualiza la URL base de la API
   */
  setApiBaseUrl(url: string): void {
    this.apiBaseUrl = url;
  }

  /**
   * 🖼️ Verifica si una imagen existe y es accesible
   */
  async checkImageExists(imageUrl: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = imageUrl;
    });
  }

  /**
   * 📦 Prepara un FormData con una imagen
   */
  prepareImageFormData(file: File, fieldName: string = 'foto_perfil'): FormData {
    const formData = new FormData();
    formData.append(fieldName, file);
    return formData;
  }

  /**
   * ⬆️ Sube una imagen de perfil al servidor
   */
  uploadProfileImage(file: File): Observable<any> {
    const formData = this.prepareImageFormData(file, 'foto_perfil');
    return this.http.put(`${this.apiBaseUrl}/api/usuario/foto-perfil`, formData);
  }

  /**
   * ⬆️ Sube una imagen de portada al servidor
   */
  uploadCoverImage(file: File): Observable<any> {
    const formData = this.prepareImageFormData(file, 'foto_portada');
    return this.http.put(`${this.apiBaseUrl}/api/usuario/foto-portada`, formData);
  }

  /**
   * 🗑️ Elimina la imagen de perfil del usuario
   */
  deleteProfileImage(): Observable<any> {
    return this.http.delete(`${this.apiBaseUrl}/api/usuario/foto-perfil`);
  }

  /**
   * 🗑️ Elimina la imagen de portada del usuario
   */
  deleteCoverImage(): Observable<any> {
    return this.http.delete(`${this.apiBaseUrl}/api/usuario/foto-portada`);
  }
}