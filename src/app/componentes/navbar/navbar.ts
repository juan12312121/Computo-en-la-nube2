// ==================== navbar.component.ts ====================
import { animate, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { AutenticacionService, Usuario } from '../../core/servicios/autenticacion/autenticacion';
import { Theme, ThemeService } from '../../core/servicios/temas';
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
  imports: [CommonModule, RouterModule, BotonCrearPost],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css'],
  animations: [
    trigger('slideDown', [
      transition(':enter', [
        style({ height: '0', opacity: '0' }),
        animate('300ms ease-out', style({ height: '*', opacity: '1' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ height: '0', opacity: '0' }))
      ])
    ])
  ]
})
export class NavbarComponent implements OnInit, OnDestroy {
  @Output() openCreate = new EventEmitter<void>();
  
  // Referencias a los sliders
  @ViewChild('themeSlider') themeSlider?: ElementRef<HTMLDivElement>;
  @ViewChild('themeSliderMobile') themeSliderMobile?: ElementRef<HTMLDivElement>;

  // Usuario autenticado
  currentUser: Usuario | null = null;
  isLoggedIn = false;
  
  showCrearPost = false;
  showMobileMenu = false;
  showMobileProfileMenu = false;
  showProfileMenu = false;
  showNotifications = false;
  showThemeMenu = false;

  currentTheme!: Theme;
  themes: Theme[] = [];
  
  // Control de scroll para desktop
  canScrollLeft = false;
  canScrollRight = true;
  
  // Control de scroll para móvil
  canScrollLeftMobile = false;
  canScrollRightMobile = true;
  
  private themeSubscription?: Subscription;
  private authSubscription?: Subscription;

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

  // Getters para el usuario
  get userName(): string {
    return this.currentUser?.nombre_completo || 'Usuario';
  }

  get userUsername(): string {
    return this.currentUser?.nombre_usuario ? `@${this.currentUser.nombre_usuario}` : '@usuario';
  }

  get userAvatar(): string {
    return this.currentUser?.foto_perfil_url || 'https://i.pravatar.cc/100';
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
    private router: Router
  ) {
    console.log('🚀 Navbar inicializado');
    
    this.currentTheme = this.themeService.getCurrentTheme();
    this.themes = this.themeService.getThemes();

    // Cerrar dropdowns al hacer click fuera
    document.addEventListener('click', (event: Event) => {
      const target = event.target as HTMLElement;
      if (
        target.closest('.profile-toggle') ||
        target.closest('.profile-dropdown') ||
        target.closest('.notification-toggle') ||
        target.closest('.notification-panel') ||
        target.closest('.theme-toggle') ||
        target.closest('.theme-dropdown')
      ) return;

      this.showProfileMenu = false;
      this.showNotifications = false;
      this.showThemeMenu = false;
    });
  }

  ngOnInit(): void {
    console.log('📱 Navbar OnInit - Inicializando suscripciones');

    // Suscribirse a cambios de tema
    this.themeSubscription = this.themeService.currentTheme$.subscribe(theme => {
      this.currentTheme = theme;
      console.log('🎨 Tema cambiado a:', theme.name);
    });

    // Suscribirse a cambios de autenticación
    this.authSubscription = this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
      this.isLoggedIn = !!user;
      
      console.log('👤 Estado de autenticación actualizado:');
      console.log('   - Usuario:', user ? user.nombre_usuario : 'No autenticado');
      console.log('   - Logueado:', this.isLoggedIn);
      console.log('   - Datos completos:', user);
    });

    // Log inicial del usuario
    const initialUser = this.authService.currentUserValue;
    console.log('👥 Usuario inicial al cargar navbar:', initialUser);
  }

  ngOnDestroy(): void {
    console.log('🔚 Navbar OnDestroy - Limpiando suscripciones');
    
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    document.body.classList.remove('mobile-menu-open');
  }

  applyTheme(themeId: string): void {
    console.log('🎨 Aplicando tema:', themeId);
    this.themeService.setTheme(themeId);
    this.showThemeMenu = false;
  }

  toggleMobileMenu(): void {
    this.showMobileMenu = !this.showMobileMenu;
    this.showProfileMenu = false;
    this.showNotifications = false;
    this.showThemeMenu = false;
    this.showMobileProfileMenu = false;
    
    console.log('📱 Menú móvil:', this.showMobileMenu ? 'Abierto' : 'Cerrado');
    
    if (this.showMobileMenu) {
      document.body.classList.add('mobile-menu-open');
    } else {
      document.body.classList.remove('mobile-menu-open');
    }
  }

  toggleMobileProfileMenu(): void {
    this.showMobileProfileMenu = !this.showMobileProfileMenu;
    console.log('👤 Menú perfil móvil:', this.showMobileProfileMenu ? 'Abierto' : 'Cerrado');
  }

  toggleProfileMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.showProfileMenu = !this.showProfileMenu;
    this.showNotifications = false;
    this.showThemeMenu = false;
    console.log('👤 Menú perfil:', this.showProfileMenu ? 'Abierto' : 'Cerrado');
  }

  toggleNotifications(event: MouseEvent): void {
    event.stopPropagation();
    this.showNotifications = !this.showNotifications;
    this.showProfileMenu = false;
    this.showThemeMenu = false;
    console.log('🔔 Notificaciones:', this.showNotifications ? 'Abiertas' : 'Cerradas');
  }

  toggleThemeMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.showThemeMenu = !this.showThemeMenu;
    this.showProfileMenu = false;
    this.showNotifications = false;
    console.log('🎨 Menú temas:', this.showThemeMenu ? 'Abierto' : 'Cerrado');
  }

  onOpenCreate(): void {
    console.log('➕ Abriendo modal crear post');
    this.showCrearPost = true;
  }

  markAsRead(notificationId: number): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.isUnread = false;
      console.log('✅ Notificación marcada como leída:', notificationId);
    }
  }

  markAllAsRead(): void {
    this.notifications.forEach(n => n.isUnread = false);
    console.log('✅ Todas las notificaciones marcadas como leídas');
  }

  deleteNotification(notificationId: number): void {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    console.log('🗑️ Notificación eliminada:', notificationId);
  }

  logout(): void {
    console.log('🚪 Iniciando cierre de sesión...');
    console.log('👤 Usuario antes de logout:', this.currentUser);
    
    this.authService.logout().subscribe({
      next: () => {
        console.log('✅ Logout exitoso');
        console.log('🔀 Redirigiendo a /login');
        
        // Cerrar todos los menús
        this.showProfileMenu = false;
        this.showMobileMenu = false;
        this.showMobileProfileMenu = false;
        this.showNotifications = false;
        this.showThemeMenu = false;
        document.body.classList.remove('mobile-menu-open');
        
        // Redirigir al login
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('❌ Error en logout:', error);
        // Aún así limpiar sesión localmente
        this.authService.limpiarSesion();
        this.router.navigate(['/login']);
      }
    });
  }

  // ========== MÉTODOS PARA SLIDER DE TEMAS (DESKTOP) ==========
  
  scrollThemes(direction: 'left' | 'right'): void {
    if (!this.themeSlider) return;
    
    const scrollAmount = 200;
    const container = this.themeSlider.nativeElement;
    
    if (direction === 'left') {
      container.scrollLeft -= scrollAmount;
    } else {
      container.scrollLeft += scrollAmount;
    }
    
    // Actualizar estado de botones después del scroll
    setTimeout(() => this.onThemeScroll(), 100);
  }

  onThemeScroll(): void {
    if (!this.themeSlider) return;
    
    const container = this.themeSlider.nativeElement;
    this.canScrollLeft = container.scrollLeft > 0;
    this.canScrollRight = container.scrollLeft < (container.scrollWidth - container.clientWidth - 10);
  }

  // ========== MÉTODOS PARA SLIDER DE TEMAS (MÓVIL) ==========
  
  scrollThemesMobile(direction: 'left' | 'right'): void {
    if (!this.themeSliderMobile) return;
    
    const scrollAmount = 300; // Aumentado para scroll más largo
    const container = this.themeSliderMobile.nativeElement;
    
    if (direction === 'left') {
      container.scrollLeft -= scrollAmount;
    } else {
      container.scrollLeft += scrollAmount;
    }
    
    // Actualizar estado de botones después del scroll
    setTimeout(() => this.onThemeScrollMobile(), 150);
  }

  onThemeScrollMobile(): void {
    if (!this.themeSliderMobile) return;
    
    const container = this.themeSliderMobile.nativeElement;
    const scrollLeft = container.scrollLeft;
    const maxScroll = container.scrollWidth - container.clientWidth;
    
    // Dar un margen de 10px para considerar que llegó al final
    this.canScrollLeftMobile = scrollLeft > 10;
    this.canScrollRightMobile = scrollLeft < (maxScroll - 10);
    
    console.log('📱 Scroll móvil:', {
      scrollLeft,
      maxScroll,
      canLeft: this.canScrollLeftMobile,
      canRight: this.canScrollRightMobile
    });
  }
}