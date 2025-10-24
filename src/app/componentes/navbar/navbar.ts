// ==================== navbar.component.ts ====================
import { Component, EventEmitter, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BotonCrearPost } from '../boton-crear-post/boton-crear-post';
import { ThemeService, Theme } from '../../core/servicios/temas';
import { Subscription } from 'rxjs';

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
  styleUrls: ['./navbar.css']
})
export class NavbarComponent implements OnInit, OnDestroy {
  @Output() openCreate = new EventEmitter<void>();

  isLoggedIn = true;
  showCrearPost = false;

  user = {
    name: 'Juan Carlos',
    username: '@juan123',
    avatar: 'https://i.pravatar.cc/100'
  };

  showMobileMenu = false;
  showProfileMenu = false;
  showNotifications = false;
  showThemeMenu = false;

  currentTheme: Theme;
  themes: Theme[] = [];
  
  private themeSubscription?: Subscription;

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

  // Obtener el tema actual
  get currentThemeData(): Theme {
    return this.currentTheme;
  }

  // Obtener el ID del tema actual para el HTML
  get currentThemeId(): string {
    return this.currentTheme.id;
  }

  constructor(private themeService: ThemeService) {
    // Inicializar el tema actual y la lista de temas
    this.currentTheme = this.themeService.getCurrentTheme();
    this.themes = this.themeService.getThemes();

    // Cerrar menús al hacer clic fuera
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
    // Suscribirse a cambios de tema desde el servicio
    this.themeSubscription = this.themeService.currentTheme$.subscribe(theme => {
      this.currentTheme = theme;
      console.log('✅ Tema cambiado a:', theme.name);
    });
  }

  ngOnDestroy(): void {
    // Limpiar suscripción para evitar memory leaks
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
  }

  // Aplicar tema usando el servicio global
  applyTheme(themeId: string): void {
    this.themeService.setTheme(themeId);
    this.showThemeMenu = false;
  }

  toggleMobileMenu(): void {
    this.showMobileMenu = !this.showMobileMenu;
    this.showProfileMenu = false;
    this.showNotifications = false;
    this.showThemeMenu = false;
  }

  toggleProfileMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.showProfileMenu = !this.showProfileMenu;
    this.showNotifications = false;
    this.showThemeMenu = false;
  }

  toggleNotifications(event: MouseEvent): void {
    event.stopPropagation();
    this.showNotifications = !this.showNotifications;
    this.showProfileMenu = false;
    this.showThemeMenu = false;
  }

  toggleThemeMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.showThemeMenu = !this.showThemeMenu;
    this.showProfileMenu = false;
    this.showNotifications = false;
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
    this.isLoggedIn = false;
    this.showProfileMenu = false;
    this.showMobileMenu = false;
    console.log('Cerrando sesión...');
  }

  login(): void {
    this.isLoggedIn = true;
    this.showProfileMenu = false;
  }
}