// ==================== navbar.component.ts ====================
import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AutenticacionService, Usuario } from '../../core/servicios/autenticacion/autenticacion';
import { Theme, ThemeService } from '../../core/servicios/temas';
import { UsuarioBusqueda, UsuarioService } from '../../core/servicios/usuarios/usuarios';
import { BotonCrearPost } from '../boton-crear-post/boton-crear-post';

interface Notification {
  id: number;
  user: string;
  initials: string;
  action: string;
  time: string;
  avatarColor: string;
  isUnread: boolean;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, BotonCrearPost],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css'],
 
})
export class NavbarComponent implements OnInit, OnDestroy {
  @Output() openCreate = new EventEmitter<void>();
  
  @ViewChild('themeSlider') themeSlider?: ElementRef<HTMLDivElement>;
  @ViewChild('themeSliderMobile') themeSliderMobile?: ElementRef<HTMLDivElement>;

  private apiBaseUrl: string;

  currentUser: Usuario | null = null;
  isLoggedIn = false;
  
  showCrearPost = false;
  showMobileMenu = false;
  showMobileProfileMenu = false;
  showProfileMenu = false;
  showNotifications = false;
  showThemeMenu = false;
  showSearchResults = false;
  showMobileSearch = false;

  currentTheme!: Theme;
  themes: Theme[] = [];
  
  canScrollLeft = false;
  canScrollRight = true;
  canScrollLeftMobile = false;
  canScrollRightMobile = true;
  
  private themeSubscription?: Subscription;
  private authSubscription?: Subscription;
  private searchSubscription?: Subscription;

  // Búsqueda
  searchQuery = '';
  searchResults: UsuarioBusqueda[] = [];
  isSearching = false;
  private searchSubject = new Subject<string>();

  notifications: Notification[] = [
    {
      id: 1,
      user: 'Juan López',
      initials: 'JL',
      action: 'comentó en tu publicación',
      time: 'Hace 30 minutos',
      avatarColor: 'linear-gradient(to bottom right, #2dd4bf, #0d9488)',
      isUnread: true
    },
    {
      id: 2,
      user: 'María García',
      initials: 'MG',
      action: 'le gustó tu publicación',
      time: 'Hace 1 hora',
      avatarColor: 'linear-gradient(to bottom right, #a855f7, #9333ea)',
      isUnread: true
    },
    {
      id: 3,
      user: 'Carlos Pérez',
      initials: 'CP',
      action: 'comenzó a seguirte',
      time: 'Hace 2 horas',
      avatarColor: 'linear-gradient(to bottom right, #3b82f6, #2563eb)',
      isUnread: true
    },
    {
      id: 4,
      user: 'Ana Martínez',
      initials: 'AM',
      action: 'compartió tu publicación',
      time: 'Hace 3 horas',
      avatarColor: 'linear-gradient(to bottom right, #ec4899, #db2777)',
      isUnread: false
    },
    {
      id: 5,
      user: 'Luis Rodríguez',
      initials: 'LR',
      action: 'comentó: "¡Excelente trabajo!"',
      time: 'Hace 5 horas',
      avatarColor: 'linear-gradient(to bottom right, #f97316, #ea580c)',
      isUnread: false
    }
  ];

  get notificationsCount(): number {
    return this.notifications.filter(n => n.isUnread).length;
  }

  get currentThemeData(): Theme {
    return this.currentTheme;
  }

  get currentThemeId(): string {
    return this.currentTheme.id;
  }

  get userName(): string {
    return this.currentUser?.nombre_completo || 'Usuario';
  }

  get userUsername(): string {
    return this.currentUser?.nombre_usuario ? `@${this.currentUser.nombre_usuario}` : '@usuario';
  }

  get userAvatar(): string {
    if (!this.currentUser?.foto_perfil_url) {
      return 'https://ui-avatars.com/api/?name=' + encodeURIComponent(this.userName) + '&background=random&size=200';
    }
    
    if (this.currentUser.foto_perfil_url.startsWith('http')) {
      return this.currentUser.foto_perfil_url;
    }
    
    return `${this.apiBaseUrl}${this.currentUser.foto_perfil_url}`;
  }

  get userInitials(): string {
    if (!this.currentUser?.nombre_completo) return 'U';
    const names = this.currentUser.nombre_completo.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return names[0][0].toUpperCase();
  }

  constructor(
    private themeService: ThemeService,
    private authService: AutenticacionService,
    private usuarioService: UsuarioService,
    private router: Router
  ) {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      this.apiBaseUrl = 'http://localhost:3000';
    } else {
      this.apiBaseUrl = 'http://13.59.190.199:3000';
    }
    
    this.currentTheme = this.themeService.getCurrentTheme();
    this.themes = this.themeService.getThemes();

    document.addEventListener('click', (event: Event) => {
      const target = event.target as HTMLElement;
      if (
        target.closest('.profile-toggle') ||
        target.closest('.profile-dropdown') ||
        target.closest('.notification-toggle') ||
        target.closest('.notification-panel') ||
        target.closest('.theme-toggle') ||
        target.closest('.theme-dropdown') ||
        target.closest('.search-container') ||
        target.closest('.search-results')
      ) return;

      this.showProfileMenu = false;
      this.showNotifications = false;
      this.showThemeMenu = false;
      this.showSearchResults = false;
    });
  }

  ngOnInit(): void {
    this.themeSubscription = this.themeService.currentTheme$.subscribe(theme => {
      this.currentTheme = theme;
    });

    this.authSubscription = this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
      this.isLoggedIn = !!user;
    });

    // Configurar búsqueda con debounce
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      if (searchTerm.trim().length > 0) {
        this.buscarUsuarios(searchTerm);
      } else {
        this.searchResults = [];
        this.showSearchResults = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.themeSubscription?.unsubscribe();
    this.authSubscription?.unsubscribe();
    this.searchSubscription?.unsubscribe();
    document.body.classList.remove('mobile-menu-open');
  }

  // ==================== BÚSQUEDA ====================

  onSearchInput(query: string): void {
    this.searchQuery = query;
    this.searchSubject.next(query);
  }

  buscarUsuarios(termino: string): void {
    this.isSearching = true;
    
    this.usuarioService.buscarUsuarios(termino).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.searchResults = response.data;
          this.showSearchResults = this.searchResults.length > 0;
        } else {
          this.searchResults = [];
          this.showSearchResults = false;
        }
        this.isSearching = false;
      },
      error: (error) => {
        console.error('Error al buscar usuarios:', error);
        this.searchResults = [];
        this.showSearchResults = false;
        this.isSearching = false;
      }
    });
  }

  getUsuarioAvatar(usuario: UsuarioBusqueda): string {
    if (!usuario.foto_perfil_url) {
      return 'https://ui-avatars.com/api/?name=' + encodeURIComponent(usuario.nombre_completo) + '&background=random&size=100';
    }
    
    if (usuario.foto_perfil_url.startsWith('http')) {
      return usuario.foto_perfil_url;
    }
    
    return `${this.apiBaseUrl}${usuario.foto_perfil_url}`;
  }

  verPerfil(usuario: UsuarioBusqueda): void {
    this.searchQuery = '';
    this.searchResults = [];
    this.showSearchResults = false;
    this.showMobileSearch = false;
    this.showMobileMenu = false;
    this.router.navigate(['/perfil', usuario.id]);
  }

  limpiarBusqueda(): void {
    this.searchQuery = '';
    this.searchResults = [];
    this.showSearchResults = false;
  }

  toggleMobileSearch(): void {
    this.showMobileSearch = !this.showMobileSearch;
    if (!this.showMobileSearch) {
      this.limpiarBusqueda();
    }
  }

  // ==================== RESTO DE MÉTODOS ====================

  applyTheme(themeId: string): void {
    this.themeService.setTheme(themeId);
    this.showThemeMenu = false;
  }

  toggleMobileMenu(): void {
    this.showMobileMenu = !this.showMobileMenu;
    this.showProfileMenu = false;
    this.showNotifications = false;
    this.showThemeMenu = false;
    this.showMobileProfileMenu = false;
    this.showMobileSearch = false;
    
    if (this.showMobileMenu) {
      document.body.classList.add('mobile-menu-open');
    } else {
      document.body.classList.remove('mobile-menu-open');
    }
  }

  toggleMobileProfileMenu(): void {
    this.showMobileProfileMenu = !this.showMobileProfileMenu;
  }

  toggleProfileMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.showProfileMenu = !this.showProfileMenu;
    this.showNotifications = false;
    this.showThemeMenu = false;
    this.showSearchResults = false;
  }

  toggleNotifications(event: MouseEvent): void {
    event.stopPropagation();
    this.showNotifications = !this.showNotifications;
    this.showProfileMenu = false;
    this.showThemeMenu = false;
    this.showSearchResults = false;
  }

  toggleThemeMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.showThemeMenu = !this.showThemeMenu;
    this.showProfileMenu = false;
    this.showNotifications = false;
    this.showSearchResults = false;
  }

  onOpenCreate(): void {
    this.showCrearPost = true;
  }

  markAsRead(notificationId: number): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.isUnread = false;
    }
  }

  markAllAsRead(): void {
    this.notifications.forEach(n => n.isUnread = false);
  }

  deleteNotification(notificationId: number): void {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.showProfileMenu = false;
        this.showMobileMenu = false;
        this.showMobileProfileMenu = false;
        this.showNotifications = false;
        this.showThemeMenu = false;
        document.body.classList.remove('mobile-menu-open');
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Error en logout:', error);
        this.authService.limpiarSesion();
        this.router.navigate(['/login']);
      }
    });
  }

  scrollThemes(direction: 'left' | 'right'): void {
    if (!this.themeSlider) return;
    
    const scrollAmount = 200;
    const container = this.themeSlider.nativeElement;
    
    if (direction === 'left') {
      container.scrollLeft -= scrollAmount;
    } else {
      container.scrollLeft += scrollAmount;
    }
    
    setTimeout(() => this.onThemeScroll(), 100);
  }

  onThemeScroll(): void {
    if (!this.themeSlider) return;
    
    const container = this.themeSlider.nativeElement;
    this.canScrollLeft = container.scrollLeft > 0;
    this.canScrollRight = container.scrollLeft < (container.scrollWidth - container.clientWidth - 10);
  }

  scrollThemesMobile(direction: 'left' | 'right'): void {
    if (!this.themeSliderMobile) return;
    
    const scrollAmount = 300;
    const container = this.themeSliderMobile.nativeElement;
    
    if (direction === 'left') {
      container.scrollLeft -= scrollAmount;
    } else {
      container.scrollLeft += scrollAmount;
    }
    
    setTimeout(() => this.onThemeScrollMobile(), 150);
  }

  onThemeScrollMobile(): void {
    if (!this.themeSliderMobile) return;
    
    const container = this.themeSliderMobile.nativeElement;
    const scrollLeft = container.scrollLeft;
    const maxScroll = container.scrollWidth - container.clientWidth;
    
    this.canScrollLeftMobile = scrollLeft > 10;
    this.canScrollRightMobile = scrollLeft < (maxScroll - 10);
  }
}