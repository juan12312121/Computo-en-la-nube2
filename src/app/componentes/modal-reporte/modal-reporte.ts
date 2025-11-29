
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-modal-reporte',
  imports: [CommonModule,FormsModule],
  templateUrl: './modal-reporte.html',
  styleUrl: './modal-reporte.css'
})
export class ModalReporte {

 @Input() isVisible = false;
  @Input() loading = false;
  @Input() success = false;
  @Input() error = '';
  @Input() motivo = '';
  @Input() descripcion = '';
  @Input() motivosValidos: string[] = [];
  @Input() cardBg = '';
  @Input() borderColor = '';
  @Input() textPrimaryClass = '';
  @Input() textSecondaryClass = '';
  @Input() btnCancelar = '';
  @Input() ringColor = '#f97316';
  
  @Output() cerrar = new EventEmitter<void>();
  @Output() enviarReporte = new EventEmitter<void>();
  @Output() motivoChange = new EventEmitter<string>();
  @Output() descripcionChange = new EventEmitter<string>();
}