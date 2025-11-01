import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Theme } from '../../core/servicios/temas';

export type TabType = 'todo' | 'fotos' | 'documentos' | 'secciones';

@Component({
  selector: 'app-profile-tabs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-tabs.html',
  styleUrls: ['./profile-tabs.css']
})
export class ProfileTabsComponent {
  @Input() activeTab: TabType = 'todo';
  @Input() currentTheme!: Theme;
  
  @Output() cambiarTab = new EventEmitter<TabType>();
}