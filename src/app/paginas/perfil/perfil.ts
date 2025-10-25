import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NavbarComponent } from '../../componentes/navbar/navbar';

interface Post {
  id: number;
  content: string;
  image: string | null;
  category: string;
  likes: number;
  comments: number;
  time: string;
}

interface Photo {
  id: number;
  url: string;
  caption: string;
}

interface Document {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  size: string;
  date: string;
}

interface Section {
  id: number;
  name: string;
  icon: string;
  color: string;
  posts: number;
}

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule,NavbarComponent ],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css'
})
export class PerfilComponent {
  isOwnProfile = false;
  activeTab: 'todo' | 'fotos' | 'documentos' | 'secciones' = 'todo';
  showPhotoModal = false;
  showSectionModal = false;
  selectedPhoto: Photo | null = null;
  selectedSection: Section | null = null;

  posts: Post[] = [
    {
      id: 1,
      content: '¡Hola compañeros! Les comparto mi experiencia con el proyecto final de Desarrollo Web. Después de semanas de trabajo, logré crear una aplicación completa con React y Node.js.',
      image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=500&fit=crop',
      category: 'Programación',
      likes: 127,
      comments: 8,
      time: 'Hace 2 horas'
    },
    {
      id: 2,
      content: 'Estudiando para el examen de Algoritmos. ¿Alguien más se siente perdido con grafos? 😅',
      image: null,
      category: 'General',
      likes: 45,
      comments: 12,
      time: 'Hace 5 horas'
    },
    {
      id: 3,
      content: 'Nueva foto de mi setup de trabajo. Listo para programar toda la noche 💻✨',
      image: 'https://images.unsplash.com/photo-1547658719-da2b51169166?w=800&h=500&fit=crop',
      category: 'General',
      likes: 89,
      comments: 6,
      time: 'Hace 1 día'
    }
  ];

  photos: Photo[] = [
    { id: 1, url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=500&h=500&fit=crop', caption: 'Mi proyecto final de desarrollo web 🚀' },
    { id: 2, url: 'https://images.unsplash.com/photo-1547658719-da2b51169166?w=500&h=500&fit=crop', caption: 'Setup de trabajo' },
    { id: 3, url: 'https://images.unsplash.com/photo-1555255707-c07966088b7b?w=500&h=500&fit=crop', caption: 'Presentación de IA' },
    { id: 4, url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=500&h=500&fit=crop', caption: 'Competencia de robótica' },
    { id: 5, url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&h=500&fit=crop', caption: 'Código limpio' },
    { id: 6, url: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=500&h=500&fit=crop', caption: 'Notas de clase' }
  ];

  documents: Document[] = [
    {
      id: 1,
      name: 'Apuntes de Algoritmos.pdf',
      description: 'Notas completas del curso de Algoritmos y Estructuras de Datos, incluye ejemplos prácticos...',
      icon: 'fa-file-pdf',
      color: 'text-red-500',
      size: '2.4 MB',
      date: 'Hace 3 días'
    },
    {
      id: 2,
      name: 'Proyecto Final React.zip',
      description: 'Código fuente del proyecto final de Desarrollo Web con React, Node.js y MongoDB...',
      icon: 'fa-file-archive',
      color: 'text-yellow-500',
      size: '15.7 MB',
      date: 'Hace 1 semana'
    },
    {
      id: 3,
      name: 'Presentación IA.pptx',
      description: 'Diapositivas de la presentación sobre Inteligencia Artificial y Machine Learning...',
      icon: 'fa-file-powerpoint',
      color: 'text-orange-500',
      size: '8.3 MB',
      date: 'Hace 2 semanas'
    },
    {
      id: 4,
      name: 'Resumen Cálculo.docx',
      description: 'Resumen del curso de Cálculo Diferencial e Integral con fórmulas importantes...',
      icon: 'fa-file-word',
      color: 'text-blue-500',
      size: '1.2 MB',
      date: 'Hace 3 semanas'
    }
  ];

  sections: Section[] = [
    { id: 1, name: 'Proyectos de IA', icon: 'fa-brain', color: 'from-purple-500 to-purple-700', posts: 12 },
    { id: 2, name: 'Desarrollo Web', icon: 'fa-code', color: 'from-teal-400 to-teal-600', posts: 23 },
    { id: 3, name: 'Tutoriales', icon: 'fa-graduation-cap', color: 'from-orange-400 to-orange-600', posts: 18 },
    { id: 4, name: 'Recursos de Estudio', icon: 'fa-book', color: 'from-blue-400 to-blue-600', posts: 31 },
    { id: 5, name: 'Eventos y Conferencias', icon: 'fa-calendar', color: 'from-pink-400 to-pink-600', posts: 7 },
    { id: 6, name: 'Colaboraciones', icon: 'fa-users', color: 'from-green-400 to-green-600', posts: 15 }
  ];

  toggleProfileMode(): void {
    this.isOwnProfile = !this.isOwnProfile;
  }

  switchTab(tab: 'todo' | 'fotos' | 'documentos' | 'secciones'): void {
    this.activeTab = tab;
  }

  openPhotoModal(photoId: number): void {
    this.selectedPhoto = this.photos.find(p => p.id === photoId) || null;
    this.showPhotoModal = true;
    document.body.style.overflow = 'hidden';
  }

  closePhotoModal(): void {
    this.showPhotoModal = false;
    this.selectedPhoto = null;
    document.body.style.overflow = 'auto';
  }

openCreateModal(): void {
  // Aquí puedes abrir tu modal de creación de post
  console.log('Abrir modal de crear post');
}


  openSectionModal(sectionId: number): void {
    this.selectedSection = this.sections.find(s => s.id === sectionId) || null;
    this.showSectionModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeSectionModal(): void {
    this.showSectionModal = false;
    this.selectedSection = null;
    document.body.style.overflow = 'auto';
  }

  onModalBackdropClick(event: MouseEvent, modalType: 'photo' | 'section'): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      if (modalType === 'photo') {
        this.closePhotoModal();
      } else {
        this.closeSectionModal();
      }
    }
  }
}
