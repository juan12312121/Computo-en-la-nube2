import { Component, EventEmitter, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BotonCrearPost } from '../boton-crear-post/boton-crear-post';
import { ThemeService, Theme } from '../../core/servicios/temas';
import { Subscription } from 'rxjs';
import { trigger, transition, style, animate } from '@angular/animations';

interface Notification {
  id: number;
  user: string;
  initials: string;
  action: string;
  time: string;
  avatarColor: string;
  isUnread: boolean;
}

interface User {
  name: string;
  username: string;
  avatar: string;
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

  isLoggedIn = true;
  showCrearPost = false;

  user: User = {
    name: 'Juan Carlos',
    username: '@juan123',
    avatar: 'https://i.pravatar.cc/100'
  };

  showMobileMenu = false;
  showMobileProfileMenu = false;
  showProfileMenu = false;
  showNotifications = false;
  showThemeMenu = false;

  currentTheme!: Theme;
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

  get currentThemeData(): Theme {
    return this.currentTheme;
  }

  get currentThemeId(): string {
    return this.currentTheme.id;
  }

  constructor(private themeService: ThemeService) {
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
        target.closest('.theme-dropdown')
      ) return;

      this.showProfileMenu = false;
      this.showNotifications = false;
      this.showThemeMenu = false;
    });
  }

  ngOnInit(): void {
    this.themeSubscription = this.themeService.currentTheme$.subscribe(theme => {
      this.currentTheme = theme;
      console.log('✅ Tema cambiado a:', theme.name);
    });
  }

  ngOnDestroy(): void {
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
    document.body.classList.remove('mobile-menu-open');
  }

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
    this.showMobileProfileMenu = false;
    document.body.classList.remove('mobile-menu-open');
    console.log('Cerrando sesión...');
  }

  login(): void {
    this.isLoggedIn = true;
    this.showProfileMenu = false;
  }
}