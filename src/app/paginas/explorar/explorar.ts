import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../componentes/navbar/navbar';

interface Tag {
  name: string;
  icon: string;
  color: string;
  posts: number;
  trending: boolean;
}

@Component({
  selector: 'app-explorar',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './explorar.html',
  styleUrl: './explorar.css'
})
export class Explorar {
  searchTerm: string = '';
  
  tags: Tag[] = [
    { name: 'Tecnología', icon: 'fa-laptop-code', color: 'teal', posts: 1247, trending: true },
    { name: 'Ciencias', icon: 'fa-flask', color: 'purple', posts: 892, trending: true },
    { name: 'Artes y Cultura', icon: 'fa-palette', color: 'pink', posts: 645, trending: false },
    { name: 'Deportes', icon: 'fa-futbol', color: 'blue', posts: 534, trending: false },
    { name: 'Salud y Bienestar', icon: 'fa-heartbeat', color: 'green', posts: 421, trending: false },
    { name: 'Vida Universitaria', icon: 'fa-graduation-cap', color: 'orange', posts: 389, trending: true },
    { name: 'Opinión', icon: 'fa-comments', color: 'indigo', posts: 312, trending: false },
    { name: 'Entrevistas', icon: 'fa-microphone', color: 'yellow', posts: 278, trending: false }
  ];
  
  filteredTags: Tag[] = [...this.tags];
  
  // Mapa de colores
  private colorMap: { [key: string]: string } = {
    'teal': '#14b8a6',
    'purple': '#a855f7',
    'pink': '#ec4899',
    'blue': '#3b82f6',
    'green': '#22c55e',
    'orange': '#f97316',
    'indigo': '#6366f1',
    'yellow': '#eab308'
  };

  private darkerColorMap: { [key: string]: string } = {
    'teal': '#0d9488',
    'purple': '#9333ea',
    'pink': '#db2777',
    'blue': '#2563eb',
    'green': '#16a34a',
    'orange': '#ea580c',
    'indigo': '#4f46e5',
    'yellow': '#ca8a04'
  };
  
  filterTags() {
    this.filteredTags = this.tags.filter(tag =>
      tag.name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }
  
  openCreateModal() {
    console.log('Abrir modal de creación');
  }

  getColor(color: string): string {
    return this.colorMap[color] || '#6b7280';
  }

  getDarkerColor(color: string): string {
    return this.darkerColorMap[color] || '#4b5563';
  }

  getGradient(color: string): string {
    const baseColor = this.colorMap[color];
    const darkerColor = this.darkerColorMap[color];
    return `linear-gradient(to bottom right, ${baseColor}, ${darkerColor})`;
  }

  onCardHover(event: MouseEvent, color: string) {
    const card = event.currentTarget as HTMLElement;
    card.style.borderColor = this.getColor(color);
  }

  onCardLeave(event: MouseEvent) {
    const card = event.currentTarget as HTMLElement;
    card.style.borderColor = '#f3f4f6';
  }
}
