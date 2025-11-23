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
import { NotificacionesComponent } from '../notificaciones/notificaciones';
import { NotificacionesService } from '../../core/servicios/notificacion/notificacion';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, BotonCrearPost, NotificacionesComponent],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css'],
})
export class Navbar implements OnInit, OnDestroy {
  @ViewChild('themeSliderMobile') themeSliderMobile?: ElementRef<HTMLDivElement>;

  @Output() publicacionCreada = new EventEmitter<any>();

  private apiBaseUrl: string;
  private themeSubscription?: Subscription;
  private authSubscription?: Subscription;
  private searchSubscription?: Subscription;
  private searchSubject = new Subject<string>();

  isLoggedIn = false;
  currentUser: Usuario | null = null;
  currentTheme!: Theme;
  themes: Theme[] = [];

  showCrearPost = false;
  showMobileMenu = false;
  showProfileMenu = false;
  showThemeMenu = false;
  showSearchResults = false;
  showMobileSearch = false;

  canScrollLeftMobile = false;
  canScrollRightMobile = true;

  searchQuery = '';
  searchResults: UsuarioBusqueda[] = [];
  isSearching = false;

  get currentThemeData(): Theme { return this.currentTheme; }
  get currentThemeId(): string { return this.currentTheme.id; }
  get userName(): string { return this.currentUser?.nombre_completo || 'Usuario'; }
  get userUsername(): string { return this.currentUser?.nombre_usuario ? `@${this.currentUser.nombre_usuario}` : '@usuario'; }
  get userAvatar(): string {
    if (!this.currentUser?.foto_perfil_url) {
      return 'https://ui-avatars.com/api/?name=' + encodeURIComponent(this.userName) + '&background=random&size=200';
    }
    if (this.currentUser.foto_perfil_url.startsWith('http')) {
      return this.currentUser.foto_perfil_url;
    }
    const path = this.currentUser.foto_perfil_url.startsWith('/') 
      ? this.currentUser.foto_perfil_url 
      : `/${this.currentUser.foto_perfil_url}`;
    return `${this.apiBaseUrl}${path}`;
  }

  constructor(
    private themeService: ThemeService,
    private authService: AutenticacionService,
    private usuarioService: UsuarioService,
    private notificacionesService: NotificacionesService,
    private router: Router
  ) {
    const host = window.location.hostname;
    this.apiBaseUrl = host === 'localhost' || host === '127.0.0.1'
      ? 'http://localhost:3000'
      : 'http://3.146.83.30:3000';

    this.currentTheme = this.themeService.getCurrentTheme();
    this.themes = this.themeService.getThemes();

    document.addEventListener('click', (e: Event) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.profile-toggle') && !target.closest('.profile-dropdown') &&
          !target.closest('.theme-toggle') && !target.closest('.theme-dropdown') &&
          !target.closest('.search-container') && !target.closest('.search-results')) {
        this.showProfileMenu = false;
        this.showThemeMenu = false;
        this.showSearchResults = false;
      }
    });
  }

  ngOnInit(): void {
    this.themeSubscription = this.themeService.currentTheme$.subscribe(theme => {
      this.currentTheme = theme;
    });

    this.authSubscription = this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
      this.isLoggedIn = !!user;
      
      if (user && user.id) {
        this.notificacionesService.conectarSSE(user.id);
        
        this.notificacionesService.solicitarPermisoNotificaciones()
          .then(() => {})
          .catch(() => {});
      } else {
        this.notificacionesService.desconectarSSE();
      }
    });

    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(term => {
      term.trim().length > 0 ? this.buscarUsuarios(term) : this.limpiarBusqueda();
    });
  }

  ngOnDestroy(): void {
    this.notificacionesService.desconectarSSE();
    
    this.themeSubscription?.unsubscribe();
    this.authSubscription?.unsubscribe();
    this.searchSubscription?.unsubscribe();
    document.body.classList.remove('mobile-menu-open');
  }

  onSearchInput(query: string): void {
    this.searchQuery = query;
    this.searchSubject.next(query);
  }

  buscarUsuarios(termino: string): void {
    this.isSearching = true;
    this.usuarioService.buscarUsuarios(termino).subscribe({
      next: (response) => {
        this.searchResults = response.success && response.data ? response.data : [];
        this.showSearchResults = this.searchResults.length > 0;
        this.isSearching = false;
      },
      error: () => {
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
    const path = usuario.foto_perfil_url.startsWith('/') ? usuario.foto_perfil_url : `/${usuario.foto_perfil_url}`;
    return `${this.apiBaseUrl}${path}`;
  }

  verPerfil(usuario: UsuarioBusqueda): void {
    this.limpiarBusqueda();
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
    if (!this.showMobileSearch) this.limpiarBusqueda();
  }

  applyTheme(themeId: string): void {
    this.themeService.setTheme(themeId);
    this.showThemeMenu = false;
  }

  toggleThemeMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.showThemeMenu = !this.showThemeMenu;
    this.showProfileMenu = false;
    this.showSearchResults = false;
  }

  scrollThemesMobile(direction: 'left' | 'right'): void {
    if (!this.themeSliderMobile) return;
    const container = this.themeSliderMobile.nativeElement;
    container.scrollLeft += direction === 'left' ? -300 : 300;
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

  toggleMobileMenu(): void {
    this.showMobileMenu = !this.showMobileMenu;
    this.showProfileMenu = false;
    this.showThemeMenu = false;
    this.showMobileSearch = false;
    document.body.classList.toggle('mobile-menu-open', this.showMobileMenu);
  }

  toggleProfileMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.showProfileMenu = !this.showProfileMenu;
    this.showThemeMenu = false;
    this.showSearchResults = false;
  }

  logout(): void {
    this.notificacionesService.desconectarSSE();
    
    this.authService.logout().subscribe({
      next: () => {
        this.showProfileMenu = false;
        this.showMobileMenu = false;
        this.showThemeMenu = false;
        document.body.classList.remove('mobile-menu-open');
        this.router.navigate(['/login']);
      },
      error: () => {
        this.authService.limpiarSesion();
        this.router.navigate(['/login']);
      }
    });
  }

  onOpenCreate(): void {
    this.showCrearPost = true;
  }

  onPostCreado(publicacionData: any): void {
    this.showCrearPost = false;
    this.publicacionCreada.emit(publicacionData);
  }

  onCloseModal(): void {
    this.showCrearPost = false;
  }
}