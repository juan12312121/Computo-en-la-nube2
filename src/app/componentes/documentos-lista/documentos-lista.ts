import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Documento, DocumentosService } from '../../core/servicios/documentos/documentos';
import { Theme } from '../../core/servicios/temas';

export interface Document {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  size: string;
  date: string;
  url?: string;
}

@Component({
  selector: 'app-documentos-lista',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './documentos-lista.html',
  styleUrl: './documentos-lista.css'
})
export class DocumentosLista implements OnInit {
  @Input() currentTheme!: Theme;
  @Input() usuarioId?: number;
  @Input() soloLectura = false;
  @Output() downloadDocument = new EventEmitter<number>();

  documents: Document[] = [];
  loading = false;
  error = '';
  subiendoArchivo = false;
  selectedFile: File | null = null;

  get esMiPerfil(): boolean {
    return !this.usuarioId || !this.soloLectura;
  }

  get puedoInteractuar(): boolean {
    return this.esMiPerfil;
  }

  constructor(private documentosService: DocumentosService) {}

  ngOnInit(): void {
    this.cargarDocumentos();
  }

  /**
   * Carga los documentos del usuario (propios o de otro usuario)
   */
  cargarDocumentos(): void {
    this.loading = true;
    this.error = '';

    const observable = this.usuarioId 
      ? this.documentosService.obtenerDocumentosUsuario(this.usuarioId)
      : this.documentosService.obtenerMisDocumentos();

    observable.subscribe({
      next: (response) => {
        if (response.success) {
          this.documents = this.mapearDocumentos(response.data);
        }
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Error al cargar los documentos';
        this.loading = false;
      }
    });
  }

  /**
   * Mapea los documentos de la API al formato del componente
   */
  private mapearDocumentos(documentos: Documento[]): Document[] {
    return documentos.map(doc => ({
      id: doc.id,
      name: doc.nombre_archivo,
      description: this.obtenerDescripcion(doc.tipo_archivo),
      icon: doc.icono,
      color: doc.color,
      size: this.documentosService.formatearTamano(doc.tamano_archivo),
      date: this.formatearFecha(doc.fecha_creacion),
      url: doc.documento_s3
    }));
  }

  /**
   * Obtiene descripción según tipo de archivo
   */
  private obtenerDescripcion(tipoArchivo: string): string {
    const descripciones: { [key: string]: string } = {
      'application/pdf': 'Documento PDF',
      'application/msword': 'Documento Word',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Documento Word',
      'application/vnd.ms-excel': 'Hoja de cálculo Excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Hoja de cálculo Excel',
      'application/vnd.ms-powerpoint': 'Presentación PowerPoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'Presentación PowerPoint'
    };

    return descripciones[tipoArchivo] || 'Documento';
  }

  /**
   * Formatea la fecha de creación
   */
  private formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    const ahora = new Date();
    const diff = ahora.getTime() - date.getTime();
    const dias = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (dias === 0) return 'Hoy';
    if (dias === 1) return 'Ayer';
    if (dias < 7) return `Hace ${dias} días`;
    if (dias < 30) return `Hace ${Math.floor(dias / 7)} semanas`;
    if (dias < 365) return `Hace ${Math.floor(dias / 30)} meses`;
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  /**
   * Elimina acentos y caracteres especiales del nombre de archivo
   */
  private normalizarNombreArchivo(nombreArchivo: string): string {
    const ultimoPunto = nombreArchivo.lastIndexOf('.');
    const nombre = ultimoPunto !== -1 ? nombreArchivo.substring(0, ultimoPunto) : nombreArchivo;
    const extension = ultimoPunto !== -1 ? nombreArchivo.substring(ultimoPunto) : '';

    const nombreNormalizado = nombre
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');

    return nombreNormalizado + extension;
  }

  /**
   * Maneja la selección de archivo
   */
  onFileSelected(event: any): void {
    if (!this.puedoInteractuar) return;

    const file = event.target.files[0];
    if (!file) return;

    const validacion = this.documentosService.validarTipoArchivo(file);
    
    if (!validacion.valido) {
      alert(validacion.mensaje);
      event.target.value = '';
      return;
    }

    const nombreNormalizado = this.normalizarNombreArchivo(file.name);
    
    const archivoNormalizado = new File([file], nombreNormalizado, {
      type: file.type,
      lastModified: file.lastModified
    });

    this.selectedFile = archivoNormalizado;
    this.subirArchivo();
  }

  /**
   * Sube el archivo seleccionado
   */
  subirArchivo(): void {
    if (!this.selectedFile || !this.puedoInteractuar) return;

    this.subiendoArchivo = true;
    this.error = '';

    this.documentosService.subirDocumento(this.selectedFile).subscribe({
      next: (response) => {
        if (response.success) {
          this.cargarDocumentos();
          this.selectedFile = null;
        }
        this.subiendoArchivo = false;
      },
      error: (error) => {
        this.error = error.error?.error || 'Error al subir el documento';
        this.subiendoArchivo = false;
        this.selectedFile = null;
      }
    });
  }

  /**
   * Maneja la descarga del documento (solo en mi perfil)
   */
  onDownloadClick(docId: number, event: MouseEvent): void {
    if (!this.puedoInteractuar) return;

    event.stopPropagation();
    const doc = this.documents.find(d => d.id === docId);
    
    if (doc?.url) {
      window.open(doc.url, '_blank');
    }
    
    this.downloadDocument.emit(docId);
  }

  /**
   * Elimina un documento (solo en mi perfil)
   */
  eliminarDocumento(docId: number, event: MouseEvent): void {
    if (!this.puedoInteractuar) return;

    event.stopPropagation();
    
    if (!confirm('¿Estás seguro de eliminar este documento?')) {
      return;
    }

    this.documentosService.eliminarDocumento(docId).subscribe({
      next: (response) => {
        if (response.success) {
          this.cargarDocumentos();
        }
      },
      error: (error) => {
        alert('Error al eliminar el documento');
      }
    });
  }

  /**
   * Trigger para input file (solo en mi perfil)
   */
  triggerFileInput(): void {
    if (!this.puedoInteractuar) return;

    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    fileInput?.click();
  }
}