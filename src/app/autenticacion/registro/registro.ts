import { Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './registro.html',
  styleUrl: './registro.css',
  encapsulation: ViewEncapsulation.None
})
export class Registro {
  username = '';
  nombreCompleto = '';
  email = '';
  password = '';
  mantenerSesion = false;
  mostrarPassword = false;

  constructor(private router: Router) {}

  togglePasswordVisibility() {
    this.mostrarPassword = !this.mostrarPassword;
  }

  onSubmit() {
    if (!this.username || !this.nombreCompleto || !this.email || !this.password) {
      alert('Por favor completa todos los campos');
      return;
    }
    console.log('Registrando usuario:', {
      username: this.username,
      nombreCompleto: this.nombreCompleto,
      email: this.email,
      mantenerSesion: this.mantenerSesion
    });
    // Aquí iría la lógica para enviar al backend
  }

  irALogin() {
    this.router.navigate(['/login']);
  }
}