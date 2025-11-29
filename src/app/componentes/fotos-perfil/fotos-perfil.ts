import { CommonModule } from '@angular/common';
import { Component, HostListener, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { Subscription } from 'rxjs';
import { Theme, ThemeService } from '../../core/servicios/temas';
import { FotosService } from '../../core/servicios/fotos/fotos';

interface Photo {
  id: number | string;
  url: string;
  caption: string;
  postId?: number;
  tipo: 'perfil' | 'portada' | 'publicacion';
  fecha?: string | null;
}

@Component({
  selector: 'app-fotos-perfil',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './fotos-perfil.html',
  styleUrl: './fotos-perfil.css'
})
export class FotosPerfil implements OnInit, OnDestroy, OnChanges {
  @Input() photos: Photo[] = [];
  @Input() cargando = false;
  @Input() usuarioId?: number;

  currentTheme: Theme;
  private themeSubscription?: Subscription;

  selectedPhoto: Photo | null = null;
  showPhotoModal = false;
  currentPhotoIndex = 0;

  photosProcessed: Photo[] = [];

  cargandoAutomatico = false;
  errorCarga = false;
  mensajeError = '';

  constructor(
    private themeService: ThemeService,
    private fotosService: FotosService
  ) {
    this.currentTheme = this.themeService.getCurrentTheme();
  }

  ngOnInit(): void {
    if (this.photos.length === 0 && this.usuarioId) {
      this.cargarFotosUsuario(this.usuarioId);
    } else {
      this.procesarFotos();
    }
    
    this.themeSubscription = this.themeService.currentTheme$.subscribe(theme => {
      this.currentTheme = theme;
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['photos']) {
      this.procesarFotos();
    }

    if (changes['usuarioId'] && !changes['usuarioId'].firstChange) {
      const nuevoUsuarioId = changes['usuarioId'].currentValue;
      if (nuevoUsuarioId) {
        this.cargarFotosUsuario(nuevoUsuarioId);
      }
    }
  }

  ngOnDestroy(): void {
    this.themeSubscription?.unsubscribe();
  }

  private cargarFotosUsuario(usuarioId: number): void {
    this.cargandoAutomatico = true;
    this.errorCarga = false;
    this.mensajeError = '';
    
    this.fotosService.obtenerFotosUsuario(usuarioId).subscribe({
      next: (fotos) => {
        this.photos = fotos;
        this.procesarFotos();
        this.cargandoAutomatico = false;
      },
      error: (error) => {
        this.cargandoAutomatico = false;
        this.errorCarga = true;
        this.mensajeError = error.error?.mensaje || 'Error al cargar las fotos';
      }
    });
  }

  recargarFotos(): void {
    if (this.usuarioId) {
      this.cargarFotosUsuario(this.usuarioId);
    }
  }

  private procesarFotos(): void {
    this.photosProcessed = this.photos.map(photo => {
      let urlCorregida = photo.url;

      if (urlCorregida.includes('/uploads/perfil/')) {
        urlCorregida = urlCorregida.replace('/uploads/perfil/', '/perfiles/');
      }

      if (urlCorregida.includes('/uploads/portadas/')) {
        urlCorregida = urlCorregida.replace('/uploads/portadas/', '/portadas/');
      }

      return {
        ...photo,
        url: urlCorregida
      };
    });
  }

  getTipoLabel(tipo: 'perfil' | 'portada' | 'publicacion'): string {
    const labels = {
      'perfil': 'Perfil',
      'portada': 'Portada',
      'publicacion': 'Post'
    };
    return labels[tipo];
  }

  getIconClass(tipo: 'perfil' | 'portada' | 'publicacion'): string {
    const icons = {
      'perfil': 'fas fa-user',
      'portada': 'fas fa-image',
      'publicacion': 'fas fa-camera'
    };
    return icons[tipo];
  }

  getBadgeClass(tipo: 'perfil' | 'portada' | 'publicacion'): string {
    const classes = {
      'perfil': 'bg-blue-500 text-white',
      'portada': 'bg-purple-500 text-white',
      'publicacion': 'bg-green-500 text-white'
    };
    return classes[tipo];
  }

  formatFecha(fecha: string | null | undefined): string {
    if (!fecha) return '';
    
    const date = new Date(fecha);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
    if (diffDays < 365) return `Hace ${Math.floor(diffDays / 30)} meses`;
    return `Hace ${Math.floor(diffDays / 365)} años`;
  }

  onModalImageError(event: Event): void {
    const img = event.target as HTMLImageElement | null;
    if (!img) return;

    img.style.display = 'none';

    const fallback = img.nextElementSibling as HTMLElement | null;
    if (fallback) {
      fallback.style.display = 'flex';
    }
  }

  onImageError(event: Event, photo: Photo): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.style.display = 'none';
    
    const fallbackDiv = imgElement.nextElementSibling as HTMLElement;
    if (fallbackDiv) {
      fallbackDiv.style.display = 'flex';
    }
  }

  openPhoto(photoId: number | string): void {
    const photoIndex = this.photosProcessed.findIndex(p => p.id === photoId);
    
    if (photoIndex !== -1) {
      this.currentPhotoIndex = photoIndex;
      this.selectedPhoto = this.photosProcessed[photoIndex];
      this.showPhotoModal = true;
      document.body.style.overflow = 'hidden';
    }
  }

  closePhotoModal(): void {
    this.showPhotoModal = false;
    this.selectedPhoto = null;
    document.body.style.overflow = 'auto';
  }

  onPhotoBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('photo-modal-backdrop')) {
      this.closePhotoModal();
    }
  }

  nextPhoto(): void {
    if (this.currentPhotoIndex < this.photosProcessed.length - 1) {
      this.currentPhotoIndex++;
      this.selectedPhoto = this.photosProcessed[this.currentPhotoIndex];
    }
  }

  previousPhoto(): void {
    if (this.currentPhotoIndex > 0) {
      this.currentPhotoIndex--;
      this.selectedPhoto = this.photosProcessed[this.currentPhotoIndex];
    }
  }

  goToPost(postId: number): void {
    this.closePhotoModal();
    // Implementar navegación: this.router.navigate(['/post', postId]);
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (!this.showPhotoModal) return;

    switch(event.key) {
      case 'ArrowRight':
        this.nextPhoto();
        event.preventDefault();
        break;
      case 'ArrowLeft':
        this.previousPhoto();
        event.preventDefault();
        break;
      case 'Escape':
        this.closePhotoModal();
        event.preventDefault();
        break;
    }
  }
}