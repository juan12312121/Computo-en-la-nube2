import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Theme } from '../../core/servicios/temas';

export interface Document {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  size: string;
  date: string;
}

@Component({
  selector: 'app-documentos-lista',
  standalone: true,
  imports: [CommonModule],
 templateUrl: './documentos-lista.html',
  styleUrl: './documentos-lista.css'
})
export class DocumentosLista {
  @Input() documents: Document[] = [];
  @Input() currentTheme!: Theme;
  @Output() downloadDocument = new EventEmitter<number>();

  onDownloadClick(docId: number, event: MouseEvent): void {
    event.stopPropagation();
    this.downloadDocument.emit(docId);
  }
}
