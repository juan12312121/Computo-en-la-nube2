import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Theme } from '../../core/servicios/temas';

export interface Section {
  id: number;
  name: string;
  icon: string;
  color: string;
  posts: number;
}

@Component({
  selector: 'app-secciones-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './secciones-grid.html',
  styleUrl: './secciones-grid.css'

})
export class SeccionesGrid {
  @Input() sections: Section[] = [];
  @Input() currentTheme!: Theme;
  @Output() sectionSelected = new EventEmitter<number>();

  showModal = false;
  selectedSection: Section | null = null;

  onSectionClick(sectionId: number): void {
    this.selectedSection = this.sections.find(s => s.id === sectionId) || null;
    this.showModal = true;
    document.body.style.overflow = 'hidden';
    this.sectionSelected.emit(sectionId);
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedSection = null;
    document.body.style.overflow = 'auto';
  }

  onModalBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.closeModal();
    }
  }
}