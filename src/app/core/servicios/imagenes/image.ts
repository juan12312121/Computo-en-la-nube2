import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';

/**
 * 🖼️ Servicio para gestionar URLs de imágenes
 * Centraliza la lógica de construcción de URLs para imágenes del backend
 * ✅ Configurado para almacenamiento LOCAL
 */
@Injectable({
  providedIn: 'root'
})
export class ImageService {
  // ✅ DINÁMICO - Se extrae de la config pero sin el /api
  private readonly apiBaseUrl: string = environment.socketUrl;

  constructor(private http: HttpClient) {
    console.log('🖼️ ImageService inicializado');
    console.log('📍 API Base URL (LOCAL):', this.apiBaseUrl);
  }

  /**
   * 🖼️ Obtiene la URL completa de una imagen de perfil
   */
  getProfileImageUrl(fotoUrl: string | null | undefined): string | null {
    const url = this.buildImageUrl(fotoUrl);
    if (url) {
      console.log('👤 URL foto perfil:', url);
    }
    return url;
  }

  /**
   * 🖼️ Obtiene la URL completa de una imagen de portada
   */
  getCoverImageUrl(fotoUrl: string | null | undefined): string | null {
    const url = this.buildImageUrl(fotoUrl);
    if (url) {
      console.log('🖼️ URL foto portada:', url);
    }
    return url;
  }

  /**
   * 🖼️ Obtiene la URL completa de cualquier imagen del sistema
   */
  getImageUrl(imagePath: string | null | undefined): string | null {
    return this.buildImageUrl(imagePath);
  }

  /**
   * 🛠️ Construye la URL completa de una imagen para localhost
   */
  private buildImageUrl(imagePath: string | null | undefined): string | null {
    if (!imagePath || imagePath.trim() === '') {
      return null;
    }

    // Si es una URL de localhost o AWS antigua, rewrite al backend real
    if (imagePath.startsWith('http://localhost:3000') || imagePath.startsWith('http://3.146.83.30:3000')) {
      return imagePath.replace(/https?:\/\/[^/]+(:[0-9]+)?/, this.apiBaseUrl);
    }

    // Si ya es una URL completa (localhost o externa), retornarla
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    // Si es ruta relativa, construir URL local
    const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    const fullUrl = `${this.apiBaseUrl}${normalizedPath}`;

    console.log('🔧 URL construida:', {
      original: imagePath,
      construida: fullUrl
    });

    return fullUrl;
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
    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      return {
        valid: false,
        error: 'Por favor selecciona una imagen válida (JPG, PNG, GIF, WEBP)'
      };
    }

    // Validar tamaño (5MB máximo)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'La imagen no debe superar los 5MB'
      };
    }

    console.log('✅ Imagen válida:', {
      nombre: file.name,
      tipo: file.type,
      tamaño: `${(file.size / 1024 / 1024).toFixed(2)} MB`
    });

    return { valid: true };
  }

  /**
   * 🔄 Crea una URL de previsualización para una imagen
   */
  createPreviewUrl(file: File): Promise<string> {
    console.log('🔄 Creando preview para:', file.name);

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        if (e.target?.result) {
          console.log('✅ Preview creado exitosamente');
          resolve(e.target.result as string);
        } else {
          console.error('❌ No se pudo crear la previsualización');
          reject(new Error('No se pudo crear la previsualización'));
        }
      };

      reader.onerror = () => {
        console.error('❌ Error al leer el archivo');
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
   * 🖼️ Verifica si una imagen existe y es accesible
   */
  async checkImageExists(imageUrl: string): Promise<boolean> {
    console.log('🔍 Verificando existencia de imagen:', imageUrl);

    return new Promise((resolve) => {
      const img = new Image();

      img.onload = () => {
        console.log('✅ Imagen existe y es accesible');
        resolve(true);
      };

      img.onerror = () => {
        console.warn('⚠️ Imagen no existe o no es accesible');
        resolve(false);
      };

      img.src = imageUrl;
    });
  }

  /**
   * 📦 Prepara un FormData con una imagen
   */
  prepareImageFormData(file: File, fieldName: string = 'foto_perfil'): FormData {
    const formData = new FormData();
    formData.append(fieldName, file);

    console.log('📦 FormData preparado:', {
      campo: fieldName,
      archivo: file.name,
      tamaño: `${(file.size / 1024).toFixed(2)} KB`
    });

    return formData;
  }

  /**
   * ⬆️ Sube una imagen de perfil al servidor LOCAL
   */
  uploadProfileImage(file: File): Observable<any> {
    console.log('⬆️ Subiendo imagen de perfil a localhost...');

    const formData = this.prepareImageFormData(file, 'foto_perfil');
    const url = `${this.apiBaseUrl}/api/usuarios/me`;

    console.log('📤 URL de subida:', url);

    return this.http.put(url, formData);
  }

  /**
   * ⬆️ Sube una imagen de portada al servidor LOCAL
   */
  uploadCoverImage(file: File): Observable<any> {
    console.log('⬆️ Subiendo imagen de portada a localhost...');

    const formData = this.prepareImageFormData(file, 'foto_portada');
    const url = `${this.apiBaseUrl}/api/usuarios/me`;

    console.log('📤 URL de subida:', url);

    return this.http.put(url, formData);
  }

  /**
   * 🗑️ Elimina la imagen de perfil del usuario
   */
  deleteProfileImage(): Observable<any> {
    console.log('🗑️ Eliminando imagen de perfil...');

    const url = `${this.apiBaseUrl}/api/usuarios/me/foto-perfil`;

    return this.http.delete(url);
  }

  /**
   * 🗑️ Elimina la imagen de portada del usuario
   */
  deleteCoverImage(): Observable<any> {
    console.log('🗑️ Eliminando imagen de portada...');

    const url = `${this.apiBaseUrl}/api/usuarios/me/foto-portada`;

    return this.http.delete(url);
  }

  /**
   * 🔄 Normaliza una ruta de imagen para localhost
   * Útil para procesar respuestas del backend
   */
  normalizeImagePath(imagePath: string | null | undefined): string | null {
    return this.buildImageUrl(imagePath);
  }

  /**
   * ✅ Verifica si una URL es válida para localhost
   */
  isValidLocalUrl(url: string): boolean {
    if (!url) return false;

    // Debe ser del backend
    if (url.startsWith(this.apiBaseUrl)) return true;
    if (url.startsWith('http://localhost:3000')) return true;

    // O debe ser una ruta relativa válida
    if (url.startsWith('/uploads/')) return true;

    return false;
  }

  /**
   * 🎨 Genera un color de avatar basado en el ID
   */
  getAvatarColor(userId: number): string {
    const colors = [
      'linear-gradient(to bottom right, #2dd4bf, #0d9488)', // Teal
      'linear-gradient(to bottom right, #f97316, #ea580c)', // Orange
      'linear-gradient(to bottom right, #a855f7, #9333ea)', // Purple
      'linear-gradient(to bottom right, #ec4899, #db2777)', // Pink
      'linear-gradient(to bottom right, #6366f1, #8b5cf6)', // Indigo
      'linear-gradient(to bottom right, #3b82f6, #2563eb)', // Blue
      'linear-gradient(to bottom right, #10b981, #059669)', // Green
      'linear-gradient(to bottom right, #fbbf24, #f59e0b)'  // Yellow
    ];

    return colors[userId % colors.length];
  }
}
