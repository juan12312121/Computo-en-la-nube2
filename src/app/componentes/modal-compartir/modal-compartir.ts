import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-modal-compartir',
  imports: [CommonModule,],
  templateUrl: './modal-compartir.html',
  styleUrl: './modal-compartir.css'
})
export class ModalCompartir {

 @Input() isVisible = false;
  @Input() postId: number | null = null;
  @Input() linkCopiado = false;
  @Input() cardBg = '';
  @Input() borderColor = '';
  @Input() textPrimaryClass = '';
  @Input() textSecondaryClass = '';
  @Input() textPrimary = '';
  @Input() hoverBackground = '';
  @Input() accentBg = '';
  @Input() bgInfo = '';
  
  @Output() cerrar = new EventEmitter<void>();
  @Output() compartirEn = new EventEmitter<string>();
  @Output() copiarLink = new EventEmitter<void>();

  get urlPost(): string {
    return `http://3.146.83.30:4200/principal/post/${this.postId}`;
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('share-modal-backdrop')) {
      this.cerrar.emit();
    }
  }
}
