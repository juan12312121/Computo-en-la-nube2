import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Documento } from '../../modelos/documento.model';
import { ApiResponse } from '../../modelos/api-response.model';

// Interfaces movidas a modelos/

@Injectable({
  providedIn: 'root'
})
export class DocumentosService {
  // ✅ SOLO LOCALHOST
  private readonly apiUrl = environment.apiUrl + '/documentos';

  constructor(private http: HttpClient) {
    console.log('📄 DocumentosService inicializado');
    console.log('📍 API URL (LOCAL):', this.apiUrl);
  }

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
   * Sube un nuevo documento (con o sin vinculación a publicación)
   */
  subirDocumento(
    archivo: File,
    nombreCustom?: string,
    publicacionId?: number
  ): Observable<ApiResponse<Documento>> {
    const formData = new FormData();
    formData.append('documento', archivo);

    if (nombreCustom) {
      formData.append('nombre_archivo_custom', nombreCustom);
    }

    if (publicacionId) {
      formData.append('publicacion_id', publicacionId.toString());
    }

    console.log('📤 Subiendo documento:', {
      archivo: archivo.name,
      tamano: this.formatearTamano(archivo.size),
      publicacionId
    });

    return this.http.post<ApiResponse<Documento>>(
      this.apiUrl,
      formData,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Obtiene documentos de una publicación específica
   */
  obtenerDocumentosPorPublicacion(publicacionId: number): Observable<ApiResponse<Documento[]>> {
    console.log('📥 Obteniendo documentos de publicación:', publicacionId);

    return this.http.get<ApiResponse<Documento[]>>(
      `${this.apiUrl}/publicacion/${publicacionId}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Vincula un documento existente a una publicación
   */
  vincularDocumentoAPublicacion(documentoId: number, publicacionId: number): Observable<ApiResponse<Documento>> {
    console.log('🔗 Vinculando documento', documentoId, 'a publicación', publicacionId);

    return this.http.patch<ApiResponse<Documento>>(
      `${this.apiUrl}/${documentoId}/vincular`,
      { publicacion_id: publicacionId },
      { headers: this.getHeaders() }
    );
  }

  /**
   * Desvincula un documento de su publicación
   */
  desvincularDocumento(documentoId: number): Observable<ApiResponse<Documento>> {
    console.log('🔓 Desvinculando documento:', documentoId);

    return this.http.patch<ApiResponse<Documento>>(
      `${this.apiUrl}/${documentoId}/desvincular`,
      {},
      { headers: this.getHeaders() }
    );
  }

  /**
   * Obtiene todos los documentos (público)
   */
  obtenerTodosDocumentos(): Observable<ApiResponse<Documento[]>> {
    console.log('📚 Obteniendo todos los documentos');

    return this.http.get<ApiResponse<Documento[]>>(this.apiUrl);
  }

  /**
   * Obtiene un documento por ID
   */
  obtenerDocumento(id: number): Observable<ApiResponse<Documento>> {
    console.log('📄 Obteniendo documento ID:', id);

    return this.http.get<ApiResponse<Documento>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Obtiene los documentos del usuario autenticado
   */
  obtenerMisDocumentos(): Observable<ApiResponse<Documento[]>> {
    console.log('📁 Obteniendo mis documentos');

    return this.http.get<ApiResponse<Documento[]>>(
      `${this.apiUrl}/mis-documentos`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Obtiene los documentos de un usuario específico
   */
  obtenerDocumentosUsuario(usuarioId: number): Observable<ApiResponse<Documento[]>> {
    console.log('👤 Obteniendo documentos del usuario:', usuarioId);

    return this.http.get<ApiResponse<Documento[]>>(
      `${this.apiUrl}/usuario/${usuarioId}`
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
      publicacion_id?: number;
    }
  ): Observable<ApiResponse<Documento>> {
    const formData = new FormData();

    if (datos.archivo) {
      formData.append('documento', datos.archivo);
      console.log('📝 Actualizando archivo:', datos.archivo.name);
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
    if (datos.publicacion_id !== undefined) {
      formData.append('publicacion_id', datos.publicacion_id.toString());
    }

    console.log('✏️ Actualizando documento ID:', id);

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
    console.log('🗑️ Eliminando documento ID:', id);

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
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/zip',
      'application/x-rar-compressed',
      'text/csv',
      'text/plain'
    ];

    if (!tiposPermitidos.includes(file.type)) {
      return {
        valido: false,
        mensaje: 'Solo se permiten archivos: PDF, Word, Excel, PowerPoint, ZIP, RAR, CSV y TXT'
      };
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        valido: false,
        mensaje: 'El archivo no debe superar los 10MB'
      };
    }

    return { valido: true, mensaje: 'Archivo válido' };
  }

  /**
   * ✅ MEJORADO: Construir URL completa para descarga
   */
  construirUrlDescarga(documento: Documento): string {
    // Priorizar documento_url (local)
    if (documento.documento_url) {
      // Si ya es URL completa, retornar
      if (documento.documento_url.startsWith('http')) {
        return documento.documento_url;
      }
      // Si es ruta relativa, construir URL completa
      return `${environment.socketUrl}${documento.documento_url.startsWith('/') ? '' : '/'}${documento.documento_url}`;
    }

    // Fallback a documento_s3 (por compatibilidad)
    if (documento.documento_s3) {
      if (documento.documento_s3.startsWith('http')) {
        return documento.documento_s3;
      }
      return `${environment.socketUrl}${documento.documento_s3.startsWith('/') ? '' : '/'}${documento.documento_s3}`;
    }

    console.warn('⚠️ Documento sin URL válida:', documento);
    return '';
  }

  /**
   * Descarga un documento
   */
  descargarDocumento(documento: Documento): void {
    const url = this.construirUrlDescarga(documento);

    if (!url) {
      console.error('❌ No se pudo construir URL de descarga para:', documento);
      alert('Error: No se puede descargar el documento');
      return;
    }

    console.log('⬇️ Descargando documento:', {
      nombre: documento.nombre_archivo,
      url: url
    });

    const link = document.createElement('a');
    link.href = url;
    link.download = documento.nombre_archivo;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Verifica si un documento está vinculado a una publicación
   */
  estaVinculado(documento: Documento): boolean {
    return documento.publicacion_id !== null && documento.publicacion_id !== undefined;
  }

  /**
   * ✅ NUEVA: Obtener icono según tipo de archivo
   */
  obtenerIconoPorTipo(tipoArchivo: string): string {
    const tipo = tipoArchivo.toLowerCase();

    if (tipo.includes('pdf')) return '📄';
    if (tipo.includes('word') || tipo.includes('document')) return '📝';
    if (tipo.includes('excel') || tipo.includes('sheet')) return '📊';
    if (tipo.includes('powerpoint') || tipo.includes('presentation')) return '📽️';
    if (tipo.includes('zip') || tipo.includes('rar')) return '🗜️';
    if (tipo.includes('text') || tipo.includes('txt')) return '📃';
    if (tipo.includes('csv')) return '📋';

    return '📎'; // Icono por defecto
  }

  /**
   * ✅ NUEVA: Obtener color según tipo de archivo
   */
  obtenerColorPorTipo(tipoArchivo: string): string {
    const tipo = tipoArchivo.toLowerCase();

    if (tipo.includes('pdf')) return 'bg-red-100 text-red-600';
    if (tipo.includes('word') || tipo.includes('document')) return 'bg-blue-100 text-blue-600';
    if (tipo.includes('excel') || tipo.includes('sheet')) return 'bg-green-100 text-green-600';
    if (tipo.includes('powerpoint') || tipo.includes('presentation')) return 'bg-orange-100 text-orange-600';
    if (tipo.includes('zip') || tipo.includes('rar')) return 'bg-purple-100 text-purple-600';
    if (tipo.includes('text') || tipo.includes('txt')) return 'bg-gray-100 text-gray-600';
    if (tipo.includes('csv')) return 'bg-teal-100 text-teal-600';

    return 'bg-gray-100 text-gray-600'; // Color por defecto
  }
}
