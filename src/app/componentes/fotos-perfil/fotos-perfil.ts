import { CommonModule } from '@angular/common';
import { Component, HostListener, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { Subscription } from 'rxjs';
import { Theme, ThemeService } from '../../core/servicios/temas';

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

  // Tema
  currentTheme: Theme;
  private themeSubscription?: Subscription;

  // Modal de imagen ampliada
  selectedPhoto: Photo | null = null;
  showPhotoModal = false;
  currentPhotoIndex = 0;

  // ✅ NUEVO: Fotos procesadas con URLs corregidas
  photosProcessed: Photo[] = [];

  constructor(private themeService: ThemeService) {
    this.currentTheme = this.themeService.getCurrentTheme();
  }

  ngOnInit(): void {
    console.log('========================================');
    console.log('🖼️ FotosPerfil - ngOnInit');
    console.log('========================================');
    console.log('📸 Total fotos recibidas:', this.photos.length);
    
    // ✅ CORREGIR URLs AL INICIALIZAR
    this.procesarFotos();
    
    console.log('📋 Fotos procesadas:', this.photosProcessed.length);
    console.log('🔄 Estado cargando:', this.cargando);
    
    // Mostrar primeras 3 URLs para debug
    if (this.photosProcessed.length > 0) {
      console.log('🔍 Primeras URLs procesadas:');
      this.photosProcessed.slice(0, 3).forEach((foto, i) => {
        console.log(`  ${i + 1}. [${foto.tipo}] ${foto.url}`);
      });
    }
    
    this.logearFotosPorTipo();
    
    this.themeSubscription = this.themeService.currentTheme$.subscribe(theme => {
      this.currentTheme = theme;
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['photos']) {
      console.log('========================================');
      console.log('🔄 FotosPerfil - Cambio en photos detectado');
      console.log('========================================');
      console.log('📸 Total fotos ANTERIOR:', changes['photos'].previousValue?.length || 0);
      console.log('📸 Total fotos NUEVO:', changes['photos'].currentValue?.length || 0);
      console.log('📋 Fotos nuevas:', JSON.stringify(changes['photos'].currentValue, null, 2));
      
      // ✅ CORREGIR URLs CUANDO CAMBIAN
      this.procesarFotos();
      this.logearFotosPorTipo();
    }

    if (changes['cargando']) {
      console.log('🔄 Estado cargando cambió:', {
        anterior: changes['cargando'].previousValue,
        nuevo: changes['cargando'].currentValue
      });
    }
  }

  ngOnDestroy(): void {
    this.themeSubscription?.unsubscribe();
  }

  // ==================== CORRECCIÓN DE URLs ====================

  /**
   * ✅ NUEVO: Procesar y corregir URLs de fotos
   */
  private procesarFotos(): void {
    console.log('🔧 Procesando fotos...');
    
    this.photosProcessed = this.photos.map(photo => {
      let urlCorregida = photo.url;
      let cambios: string[] = [];

      // 🔧 CORREGIR URLs CON /uploads/perfil/ → /perfiles/
      if (urlCorregida.includes('/uploads/perfil/')) {
        const urlAnterior = urlCorregida;
        urlCorregida = urlCorregida.replace('/uploads/perfil/', '/perfiles/');
        cambios.push(`/uploads/perfil/ → /perfiles/`);
        console.log('🔧 URL de perfil corregida:', {
          id: photo.id,
          tipo: photo.tipo,
          anterior: urlAnterior,
          nueva: urlCorregida
        });
      }

      // 🔧 CORREGIR URLs CON /uploads/portadas/ → /portadas/
      if (urlCorregida.includes('/uploads/portadas/')) {
        const urlAnterior = urlCorregida;
        urlCorregida = urlCorregida.replace('/uploads/portadas/', '/portadas/');
        cambios.push(`/uploads/portadas/ → /portadas/`);
        console.log('🔧 URL de portada corregida:', {
          id: photo.id,
          tipo: photo.tipo,
          anterior: urlAnterior,
          nueva: urlCorregida
        });
      }

      if (cambios.length > 0) {
        console.log(`✅ Foto ${photo.id} (${photo.tipo}): ${cambios.join(', ')}`);
      }

      return {
        ...photo,
        url: urlCorregida
      };
    });

    console.log('✅ Total fotos procesadas:', this.photosProcessed.length);
    console.log('📊 Distribución:', {
      perfil: this.photosProcessed.filter(p => p.tipo === 'perfil').length,
      portada: this.photosProcessed.filter(p => p.tipo === 'portada').length,
      publicacion: this.photosProcessed.filter(p => p.tipo === 'publicacion').length
    });
  }

  // ==================== MÉTODOS DE DEBUG ====================

  private logearFotosPorTipo(): void {
    console.log('========================================');
    console.log('📊 RESUMEN DE FOTOS POR TIPO');
    console.log('========================================');
    
    const fotosPerfil = this.photosProcessed.filter(p => p.tipo === 'perfil');
    const fotosPortada = this.photosProcessed.filter(p => p.tipo === 'portada');
    const fotosPublicacion = this.photosProcessed.filter(p => p.tipo === 'publicacion');
    
    console.log('👤 Fotos de perfil:', fotosPerfil.length);
    if (fotosPerfil.length > 0) {
      console.log('   ', fotosPerfil);
    }
    
    console.log('🖼️ Fotos de portada:', fotosPortada.length);
    if (fotosPortada.length > 0) {
      console.log('   ', fotosPortada);
    }
    
    console.log('📷 Fotos de publicaciones:', fotosPublicacion.length);
    if (fotosPublicacion.length > 0) {
      console.log('   IDs de posts:', fotosPublicacion.map(f => f.postId));
      fotosPublicacion.forEach((foto, index) => {
        console.log(`   ${index + 1}. Post ${foto.postId} - ${foto.caption}`);
      });
    }
    
    console.log('========================================');
    console.log('📈 TOTAL GENERAL:', this.photosProcessed.length);
    console.log('========================================');
  }

  // ==================== MÉTODOS DE UTILIDAD ====================

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

  // ==================== GESTIÓN DE FOTOS ====================

  /**
   * ✅ NUEVO: Manejar error de carga de imagen
   */
  onImageError(event: Event, photo: Photo): void {
    console.error('❌ Error cargando imagen:', {
      id: photo.id,
      tipo: photo.tipo,
      url: photo.url,
      caption: photo.caption
    });
    
    const imgElement = event.target as HTMLImageElement;
    imgElement.style.display = 'none';
    
    const fallbackDiv = imgElement.nextElementSibling as HTMLElement;
    if (fallbackDiv) {
      fallbackDiv.style.display = 'flex';
    }
  }

  openPhoto(photoId: number | string): void {
    console.log('🖼️ Abriendo foto:', photoId);
    
    // ✅ USAR photosProcessed EN LUGAR DE photos
    const photoIndex = this.photosProcessed.findIndex(p => p.id === photoId);
    console.log('📍 Índice de la foto:', photoIndex);
    
    if (photoIndex !== -1) {
      this.currentPhotoIndex = photoIndex;
      this.selectedPhoto = this.photosProcessed[photoIndex];
      this.showPhotoModal = true;
      document.body.style.overflow = 'hidden';
      
      console.log('✅ Modal de foto abierto:', this.selectedPhoto);
    } else {
      console.error('❌ Foto no encontrada con ID:', photoId);
    }
  }

  closePhotoModal(): void {
    console.log('❌ Cerrando modal de foto');
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
      console.log('➡️ Siguiente foto:', this.selectedPhoto);
    }
  }

  previousPhoto(): void {
    if (this.currentPhotoIndex > 0) {
      this.currentPhotoIndex--;
      this.selectedPhoto = this.photosProcessed[this.currentPhotoIndex];
      console.log('⬅️ Foto anterior:', this.selectedPhoto);
    }
  }

  goToPost(postId: number): void {
    console.log('📍 Navegar a publicación:', postId);
    this.closePhotoModal();
    // Aquí puedes implementar la navegación
    // Por ejemplo: this.router.navigate(['/post', postId]);
  }

  // Listener para teclas de navegación
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