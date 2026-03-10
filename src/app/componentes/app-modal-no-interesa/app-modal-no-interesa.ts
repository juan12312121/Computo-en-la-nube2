import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-app-modal-no-interesa',
  imports: [CommonModule],
  templateUrl: './app-modal-no-interesa.html',
  styleUrl: './app-modal-no-interesa.css'
})
export class AppModalNoInteresa {
 @Input() isVisible = false;
  @Input() loading = false;
  @Input() success = false;
  @Input() error = '';
  @Input() cardBg = '';
  @Input() borderColor = '';
  @Input() textPrimaryClass = '';
  @Input() textSecondaryClass = '';
  @Input() textPrimary = '';
  @Input() bgInfo = '';
  @Input() btnCancelar = '';
  
  @Output() cerrar = new EventEmitter<void>();
  @Output() confirmar = new EventEmitter<void>();
}