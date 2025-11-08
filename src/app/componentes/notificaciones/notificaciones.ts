// ==================== notificaciones.component.ts ====================
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Theme } from '../../core/servicios/temas';

export interface Notification {
  id: number;
  user: string;
  initials: string;
  action: string;
  time: string;
  avatarColor: string;
  isUnread: boolean;
}

@Component({
  selector: 'app-notificaciones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notificaciones.html',
  styleUrls: ['./notificaciones.css']
})
export class NotificacionesComponent implements OnInit, OnDestroy {
  @Input() currentTheme!: Theme;
  @Input() isMobile = false;
  @Output() close = new EventEmitter<void>();

  showNotifications = false;
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

  constructor() {
    // Escuchar clics fuera del componente
    document.addEventListener('click', this.handleClickOutside.bind(this));
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    document.removeEventListener('click', this.handleClickOutside.bind(this));
  }

  /**
   * Determina si el tema actual tiene un fondo claro o oscuro
   * para ajustar el color del texto del header
   */
  isLightTheme(): boolean {
    const lightThemes = [
      'default',
      'forest', 
      'sunset',
      'ocean',
      'rose',
      'slate',
      'lavender',
      'candy',
      'chaos'
    ];
    
    return lightThemes.includes(this.currentTheme.id);
  }

  handleClickOutside(event: Event): void {
    const target = event.target as HTMLElement;
    if (
      !target.closest('.notification-toggle') &&
      !target.closest('.notification-panel') &&
      !target.closest('.notification-container')
    ) {
      this.showNotifications = false;
    }
  }

  toggleNotifications(event: MouseEvent): void {
    event.stopPropagation();
    this.showNotifications = !this.showNotifications;
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

  closeNotifications(): void {
    this.showNotifications = false;
    this.close.emit();
  }
}