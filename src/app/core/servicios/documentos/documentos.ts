import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Documento {
  id: number;
  usuario_id: number;
  documento_url: string | null;
  documento_s3: string;
  nombre_archivo: string;
  tamano_archivo: number;
  tipo_archivo: string;
  icono: string;
  color: string;
  fecha_creacion: string;
  nombre_usuario?: string;
  nombre_completo?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentosService {
  private apiUrl = 'http://3.146.83.30:3000/api/documentos';

  constructor(private http: HttpClient) {}

  /**
   * Obtiene los headers con el token de autenticación
   */
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Sube un nuevo documento
   */
  subirDocumento(archivo: File, nombreCustom?: string): Observable<ApiResponse<Documento>> {
    const formData = new FormData();
    formData.append('documento', archivo);
    
    if (nombreCustom) {
      formData.append('nombre_archivo_custom', nombreCustom);
    }

    return this.http.post<ApiResponse<Documento>>(
      this.apiUrl,
      formData,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Obtiene todos los documentos (público)
   */
  obtenerTodosDocumentos(): Observable<ApiResponse<Documento[]>> {
    return this.http.get<ApiResponse<Documento[]>>(this.apiUrl);
  }

  /**
   * Obtiene un documento por ID
   */
  obtenerDocumento(id: number): Observable<ApiResponse<Documento>> {
    return this.http.get<ApiResponse<Documento>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Obtiene los documentos del usuario autenticado
   */
  obtenerMisDocumentos(): Observable<ApiResponse<Documento[]>> {
    return this.http.get<ApiResponse<Documento[]>>(
      `${this.apiUrl}/mis-documentos`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Actualiza un documento (nombre, icono, color o archivo completo)
   */
  actualizarDocumento(
    id: number,
    datos: {
      archivo?: File;
      nombre_archivo_custom?: string;
      icono?: string;
      color?: string;
    }
  ): Observable<ApiResponse<Documento>> {
    const formData = new FormData();

    if (datos.archivo) {
      formData.append('documento', datos.archivo);
    }
    if (datos.nombre_archivo_custom) {
      formData.append('nombre_archivo_custom', datos.nombre_archivo_custom);
    }
    if (datos.icono) {
      formData.append('icono', datos.icono);
    }
    if (datos.color) {
      formData.append('color', datos.color);
    }

    return this.http.put<ApiResponse<Documento>>(
      `${this.apiUrl}/${id}`,
      formData,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Elimina un documento
   */
  eliminarDocumento(id: number): Observable<ApiResponse<{ deleted: boolean }>> {
    return this.http.delete<ApiResponse<{ deleted: boolean }>>(
      `${this.apiUrl}/${id}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Formatea el tamaño del archivo a formato legible
   */
  formatearTamano(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Obtiene la extensión del archivo
   */
  obtenerExtension(nombreArchivo: string): string {
    const partes = nombreArchivo.split('.');
    return partes.length > 1 ? partes[partes.length - 1].toUpperCase() : 'FILE';
  }

  /**
   * Valida si el tipo de archivo es permitido
   */
  validarTipoArchivo(file: File): { valido: boolean; mensaje: string } {
    const tiposPermitidos = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];

    if (!tiposPermitidos.includes(file.type)) {
      return {
        valido: false,
        mensaje: 'Solo se permiten archivos: PDF, Word, Excel y PowerPoint'
      };
    }

    // Validar tamaño (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        valido: false,
        mensaje: 'El archivo no debe superar los 10MB'
      };
    }

    return { valido: true, mensaje: 'Archivo válido' };
  }
}