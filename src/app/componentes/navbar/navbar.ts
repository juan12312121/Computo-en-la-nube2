// ==================== navbar.component.ts ====================
import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
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

interface Theme {
  id: string;
  name: string;
  color: string;
  // Clases Tailwind para cada elemento
  gradientText: string;
  icon: string;
  hoverText: string;
  buttonGradient: string;
  headerGradient: string;
  hoverBackground: string;
  bgPrimary: string;
  textPrimary: string;
  textSecondary: string;
  borderColor: string;
  checkIcon: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, BotonCrearPost],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})
export class NavbarComponent {
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
  currentTheme = 'default';

  // Temas con clases Tailwind completas
  themes: Theme[] = [
    {
      id: 'default',
      name: 'TrinoFlow Default',
      color: 'linear-gradient(to right, #f97316, #2dd4bf)',
      gradientText: 'bg-gradient-to-r from-orange-500 to-teal-400',
      icon: 'text-orange-500',
      hoverText: 'hover:text-orange-500',
      buttonGradient: 'bg-gradient-to-r from-orange-500 to-orange-600',
      headerGradient: 'bg-gradient-to-r from-orange-500 to-teal-400',
      hoverBackground: 'hover:bg-gradient-to-r hover:from-orange-50 hover:to-teal-50',
      bgPrimary: 'bg-orange-500',
      textPrimary: 'text-orange-600',
      textSecondary: 'text-teal-500',
      borderColor: 'border-orange-200',
      checkIcon: 'text-teal-500'
    },
    {
      id: 'deep-ocean',
      name: 'Deep Ocean',
      color: 'linear-gradient(to right, #38bdf8, #0ea5e9)',
      gradientText: 'bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent',
      icon: 'text-sky-400',
      hoverText: 'hover:text-sky-400',
      buttonGradient: 'bg-gradient-to-r from-sky-400 to-blue-500',
      headerGradient: 'bg-gradient-to-r from-sky-400 to-blue-500',
      hoverBackground: 'hover:bg-gradient-to-r hover:from-sky-50 hover:to-blue-50',
      bgPrimary: 'bg-sky-400',
      textPrimary: 'text-sky-500',
      textSecondary: 'text-blue-500',
      borderColor: 'border-sky-200',
      checkIcon: 'text-blue-500'
    },
    {
      id: 'neutro',
      name: 'Neutro',
      color: 'linear-gradient(to right, #10b981, #34d399)',
      gradientText: 'bg-gradient-to-r from-emerald-500 to-emerald-400 bg-clip-text text-transparent',
      icon: 'text-emerald-500',
      hoverText: 'hover:text-emerald-500',
      buttonGradient: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
      headerGradient: 'bg-gradient-to-r from-emerald-500 to-emerald-400',
      hoverBackground: 'hover:bg-gradient-to-r hover:from-emerald-50 hover:to-emerald-50',
      bgPrimary: 'bg-emerald-500',
      textPrimary: 'text-emerald-600',
      textSecondary: 'text-emerald-400',
      borderColor: 'border-emerald-200',
      checkIcon: 'text-emerald-500'
    },
    {
      id: 'vibrante',
      name: 'Vibrante',
      color: 'linear-gradient(to right, #ef4444, #fbbf24)',
      gradientText: 'bg-gradient-to-r from-red-500 to-yellow-400 bg-clip-text text-transparent',
      icon: 'text-red-500',
      hoverText: 'hover:text-red-500',
      buttonGradient: 'bg-gradient-to-r from-red-500 to-red-600',
      headerGradient: 'bg-gradient-to-r from-red-500 to-yellow-400',
      hoverBackground: 'hover:bg-gradient-to-r hover:from-red-50 hover:to-yellow-50',
      bgPrimary: 'bg-red-500',
      textPrimary: 'text-red-600',
      textSecondary: 'text-yellow-500',
      borderColor: 'border-red-200',
      checkIcon: 'text-yellow-500'
    },
    {
      id: 'discordia',
      name: 'Discordia',
      color: 'linear-gradient(to right, #ec4899, #a855f7)',
      gradientText: 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 bg-clip-text text-transparent',
      icon: 'text-pink-500',
      hoverText: 'hover:text-pink-500',
      buttonGradient: 'bg-gradient-to-r from-pink-500 to-purple-600',
      headerGradient: 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600',
      hoverBackground: 'hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50',
      bgPrimary: 'bg-pink-500',
      textPrimary: 'text-pink-600',
      textSecondary: 'text-purple-500',
      borderColor: 'border-pink-200',
      checkIcon: 'text-purple-500'
    }
  ];

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
    return this.themes.find(t => t.id === this.currentTheme) || this.themes[0];
  }

  constructor() {
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

  // Aplicar tema (solo cambiar el ID actual)
  applyTheme(themeId: string) {
    this.currentTheme = themeId;
    this.showThemeMenu = false;
  }

  toggleMobileMenu() {
    this.showMobileMenu = !this.showMobileMenu;
    this.showProfileMenu = false;
    this.showNotifications = false;
    this.showThemeMenu = false;
  }

  toggleProfileMenu(event: MouseEvent) {
    event.stopPropagation();
    this.showProfileMenu = !this.showProfileMenu;
    this.showNotifications = false;
    this.showThemeMenu = false;
  }

  toggleNotifications(event: MouseEvent) {
    event.stopPropagation();
    this.showNotifications = !this.showNotifications;
    this.showProfileMenu = false;
    this.showThemeMenu = false;
  }

  toggleThemeMenu(event: MouseEvent) {
    event.stopPropagation();
    this.showThemeMenu = !this.showThemeMenu;
    this.showProfileMenu = false;
    this.showNotifications = false;
  }

  onOpenCreate() {
    this.showCrearPost = true;
  }

  markAsRead(notificationId: number) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.isUnread = false;
    }
  }

  markAllAsRead() {
    this.notifications.forEach(n => n.isUnread = false);
  }

  deleteNotification(notificationId: number) {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
  }

  logout() {
    this.isLoggedIn = false;
    this.showProfileMenu = false;
    this.showMobileMenu = false;
    console.log('Cerrando sesión...');
  }

  login() {
    this.isLoggedIn = true;
    this.showProfileMenu = false;
  }
}
