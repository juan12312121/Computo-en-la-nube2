import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})
export class NavbarComponent {
  @Output() openCreate = new EventEmitter<void>();

  isLoggedIn = true;

  user = {
    name: 'Juan Carlos',
    username: '@juan123',
    avatar: 'https://i.pravatar.cc/100'
  };

  showMobileMenu = false;
  showProfileMenu = false;
  showNotifications = false;

  notificationsCount = 3;

  toggleMobileMenu() {
    this.showMobileMenu = !this.showMobileMenu;
    this.showProfileMenu = false;
    this.showNotifications = false;
  }

  toggleProfileMenu(event: MouseEvent) {
    event.stopPropagation();
    this.showProfileMenu = !this.showProfileMenu;
    this.showNotifications = false;
  }

  toggleNotifications(event: MouseEvent) {
    event.stopPropagation();
    this.showNotifications = !this.showNotifications;
    this.showProfileMenu = false;
  }

  onOpenCreate() {
    this.openCreate.emit(); // <- Aquí emitimos el evento
  }

  logout() {
    this.isLoggedIn = false;
    console.log('Cerrando sesión...');
  }

  constructor() {
    document.addEventListener('click', (event: Event) => {
      const target = event.target as HTMLElement;
      if (
        target.closest('.profile-toggle') ||
        target.closest('.profile-dropdown') ||
        target.closest('.notification-toggle') ||
        target.closest('.notification-panel')
      ) return;

      this.showProfileMenu = false;
      this.showNotifications = false;
    });
  }
}
