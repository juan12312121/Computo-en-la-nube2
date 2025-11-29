import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Theme } from '../../core/servicios/temas';

@Component({
  selector: 'app-profile-loading',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-loading.html',
  styleUrls: ['./profile-loading.css'],
})
export class ProfileLoadingComponent {
  @Input() currentTheme!: Theme;
}