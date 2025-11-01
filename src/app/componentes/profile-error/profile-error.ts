import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Theme } from '../../core/servicios/temas';

@Component({
  selector: 'app-profile-error',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-error.html',
  styleUrls: ['./profile-error.css'],
})
export class ProfileErrorComponent {
  @Input() currentTheme!: Theme;
  
  @Output() reintentar = new EventEmitter<void>();
}